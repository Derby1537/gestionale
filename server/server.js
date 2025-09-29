require('dotenv').config();
const port = 3030;
const adminId = 1;
module.exports.adminId = adminId;
const express = require('express');
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const path = require('path');
const nodemailer = require("nodemailer");

const db = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
})

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', "client", "build")));
//app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})
const sendEmail = async (subject, content) => {
    try {
        const result = await transport.sendMail({
            from: 'notifica-database@planetwindows.it',
            to: process.env.EMAIL_TO,
            subject: subject,
            text: content
        })
        return result;
    }
    catch (e) {
        console.error(e);
        res.status(500).send('Internal Server Error');
    }
}

const checkAuth = async (req, res) => {
    const token = req.cookies.authToken; 
    if (!token) return false;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
        const [rows] = await db.query("SELECT id, username FROM user WHERE id = ?", [decoded.userId]);

        if(rows.length == 0) {
            return false;
        }
        rows[0].role = rows[0].id == adminId ? "admin" : "user";

        return (rows[0]);
    } catch (err) {
        res.status(401).json({ message: "Token non valido" });
    }
}

const checkQuantitaMinime = async (id, id_colore_esterno, id_colore_interno) => {
    try {
        let query = `
            SELECT *
            FROM quantita
            WHERE (id_articolo = ? OR id_accessorio = ?)
            AND id_colore_esterno = ?  
`
        let params = [id, id, id_colore_esterno];
        if(id_colore_interno) {
            params.push(id_colore_interno);
            query += "AND id_colore_interno = ?"
        }
        let [rows] = await db.query(query, params);

        if(rows.length <= 0) {
            return;
        }
        const quantitaMinima = rows[0].quantita_minima;

        [rows] = await db.query(`
SELECT 
COALESCE(UPPER(union_result.id_articolo), UPPER(union_result.id_accessorio)) AS id_prodotto,
UPPER(union_result.id_colore_esterno) AS id_colore_esterno, 
UPPER(union_result.id_colore_interno) AS id_colore_interno,
ce.descrizione AS descrizione_colore_esterno, -- Descrizione del colore esterno
ci.descrizione AS descrizione_colore_interno, -- Descrizione del colore interno
SUM(CASE WHEN union_result.tipo = 'ordine' AND union_result.consegnato = 0 THEN union_result.quantita ELSE 0 END) AS quantita_in_ordine,
SUM(CASE 
WHEN union_result.tipo = 'ordine' AND union_result.consegnato = 1 THEN union_result.quantita 
WHEN union_result.tipo = 'carico' THEN union_result.quantita 
WHEN union_result.tipo = 'scarico' THEN -union_result.quantita 
ELSE 0 
END) AS quantita_in_magazzino,
COALESCE(a.fornitore, acc.fornitore) AS fornitore,
COALESCE(a.descrizione, acc.descrizione) AS descrizione,
a.lunghezza_barra,
a.prezzo,
a.prezzo_pellicolato
FROM (
-- Select records with id_articolo from ordini, carichi, and scarichi
SELECT o.id_articolo, NULL AS id_accessorio, o.id_colore_esterno, o.id_colore_interno, o.quantita, 'ordine' AS tipo, o.consegnato
FROM ordini o
WHERE o.id_articolo IS NOT NULL

UNION ALL

SELECT o.id_articolo, NULL AS id_accessorio, o.id_colore_esterno, o.id_colore_interno, o.quantita, 'carico' AS tipo, NULL AS consegnato
FROM carichi o
WHERE o.id_articolo IS NOT NULL

UNION ALL

SELECT o.id_articolo, NULL AS id_accessorio, o.id_colore_esterno, o.id_colore_interno, o.quantita, 'scarico' AS tipo, NULL AS consegnato
FROM scarichi o
WHERE o.id_articolo IS NOT NULL

UNION ALL

-- Select records with id_accessorio from ordini, carichi, and scarichi
SELECT NULL AS id_articolo, o.id_accessorio, o.id_colore_esterno, o.id_colore_interno, o.quantita, 'ordine' AS tipo, o.consegnato
FROM ordini o
WHERE o.id_accessorio IS NOT NULL

UNION ALL

SELECT NULL AS id_articolo, o.id_accessorio, o.id_colore_esterno, o.id_colore_interno, o.quantita, 'carico' AS tipo, NULL AS consegnato
FROM carichi o
WHERE o.id_accessorio IS NOT NULL

UNION ALL

SELECT NULL AS id_articolo, o.id_accessorio, o.id_colore_esterno, o.id_colore_interno, o.quantita, 'scarico' AS tipo, NULL AS consegnato
FROM scarichi o
WHERE o.id_accessorio IS NOT NULL
) AS union_result
LEFT JOIN articoli a 
ON union_result.id_articolo = a.id AND union_result.id_accessorio IS NULL
LEFT JOIN accessori acc 
ON union_result.id_accessorio = acc.id AND union_result.id_articolo IS NULL
LEFT JOIN colori ce 
ON union_result.id_colore_esterno = ce.id -- Join per il colore esterno
LEFT JOIN colori ci 
ON union_result.id_colore_interno = ci.id -- Join per il colore interno

WHERE COALESCE(union_result.id_articolo, union_result.id_accessorio) LIKE ?
AND id_colore_esterno LIKE ? ${ id_colore_interno ? "AND id_colore_interno LIKE ?" : "" }

        GROUP BY 
            COALESCE(UPPER(union_result.id_articolo), UPPER(union_result.id_accessorio)),
            UPPER(union_result.id_colore_esterno), 
            UPPER(union_result.id_colore_interno),
            COALESCE(a.fornitore, acc.fornitore),
            COALESCE(a.descrizione, acc.descrizione)
`, [id, id_colore_esterno, id_colore_interno]);

        if(rows.length <= 0) {
            return;
        }

        if(rows[0].quantita_in_magazzino < quantitaMinima) {
            await sendEmail(`Quantità ${id + '*' + id_colore_esterno + '' + (id_colore_interno || "")}*`,
                `L'articolo ${id + '*' + id_colore_esterno + '' + (id_colore_interno || "")}* è sceso sotto la quantità minima di ${quantitaMinima} Pz con una quantità in magazzino di ${rows[0].quantita_in_magazzino} Pz`
            )
        }
    }
    catch (error) {
        console.error(error);
    }
}

const formatDate = (date) => {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

module.exports.checkAuth = checkAuth;
module.exports.checkQuantitaMinime = checkQuantitaMinime;
module.exports.db = db;
module.exports.sendEmail = sendEmail;
module.exports.formatDate = formatDate;

const magazzinoRoutes = require("./routes/magazzino/magazzino.js")
app.use("/api/magazzino", magazzinoRoutes);

const scarichiRoutes = require("./routes/magazzino/scarichi.js");
app.use("/api/magazzino/scarichi", scarichiRoutes);

const carichiRoutes = require("./routes/magazzino/carichi.js");
app.use("/api/magazzino/carichi", carichiRoutes);

const ordiniRoutes = require("./routes/magazzino/ordini.js");
app.use("/api/magazzino/ordini", ordiniRoutes);

const consegneRoutes = require("./routes/magazzino/consegne.js");
app.use("/api/magazzino/consegne", consegneRoutes);

const elencoRoutes = require("./routes/magazzino/elenco.js");
app.use("/api/magazzino/elenco", elencoRoutes);

const quantitaRoutes = require("./routes/magazzino/quantita.js");
app.use("/api/magazzino/quantita", quantitaRoutes);

const accessoriRoutes = require("./routes/magazzino/accessori.js");
app.use("/api/magazzino/accessori", accessoriRoutes);

const coloriRoutes = require("./routes/magazzino/colori.js");
app.use("/api/magazzino/colori", coloriRoutes);

const valoreRoutes = require("./routes/magazzino/valore.js");
app.use("/api/magazzino/valore", valoreRoutes);

const elencoQrRoutes = require("./routes/magazzino/elencoQr.js");
app.use("/api/magazzino/elenco_qr", elencoQrRoutes);

const listaOrdiniRoutes = require("./routes/ordini/ordini.js");
app.use("/api/ordini", listaOrdiniRoutes);

const vetriRoutes = require("./routes/ordini/vetri.js");
app.use("/api/ordini/vetri", vetriRoutes);

const lottiRoutes = require("./routes/ordini/lotti.js");
app.use("/api/ordini/lotti", lottiRoutes);

app.post("/api/supporto", async (req, res) => {
    try {
        const { descrizione } = req.body;
        
        if (!descrizione || descrizione.trim().length === 0) {
            return res.status(400).json({ field: "errore_descrizione", message: "Descrizione invalida" })
        }
        await sendEmail('Notifica utente', 'Un utente ti ha inviato un messaggio che dice\n\n' +  descrizione);

        res.status(200).json({ message: "Ticket inviato con successo" });
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
})

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.query("Select * FROM user WHERE username = ?", [username])        

        if(rows.length == 0) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({ message: "Credenziali non valide" });
        }

        const role = user.id == adminId ? "admin" : "user";

        const token = jwt.sign({ userId: user.id, role: role }, process.env.JWT_SECRET || "secretKey", { expiresIn: "1h" } );

        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 3600000
        })

        res.json({ message: "Login avvenuto con successo", username: user.username, role: role })
    }
    catch (error) {
        console.error("Errore login", error);
        res.status(500).json({ message: "Errore interno" });
    }

});

app.get("/api/me", async (req, res) => {
    const token = req.cookies.authToken; 
    if (!token) return res.status(401).json({ message: "Non autenticato" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
        const [rows] = await db.query("SELECT id, username FROM user WHERE id = ?", [decoded.userId]);

        if(rows.length == 0) {
            return res.status(401).json({ message: "Token non valido" });
        }
        rows[0].role = rows[0].id == adminId ? "admin" : "user";

        res.json(rows[0]);
    } catch (err) {
        res.status(401).json({ message: "Token non valido" });
    }
});

app.post("/api/logout", (_req, res) => {
    res.clearCookie("authToken");
    res.json({ message: "Logout effettuato" });
});

app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"))
})

app.listen(port, () => {
    console.log("Server listening on port ", port);
})
