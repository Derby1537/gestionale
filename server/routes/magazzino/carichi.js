const express = require("express");
const router = express.Router();
const { db, checkAuth } = require("../../server");

router.get("/", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        let limit = parseInt(req.query.limit) || 25;
        if(limit <= 0) limit = 25;
        let page = parseInt(req.query.page) || 1;
        if(page <= 0) page = 1;
        const offset = (page - 1) * limit;
        const id_prodotto = req.query.id_prodotto;
        const id_colore_esterno = req.query.id_colore_esterno;
        const id_colore_interno = req.query.id_colore_interno;
        const data = new Date(req.query.data) || '';
        const info = req.query.info;

        let queryString = `
            SELECT  
            o.id as id,
            COALESCE(UPPER(o.id_articolo), UPPER(o.id_accessorio)) as id_prodotto,
            UPPER(o.id_colore_esterno) as id_colore_esterno,
            UPPER(o.id_colore_interno) as id_colore_interno,
            c1.descrizione AS descrizione_colore_esterno, 
            c2.descrizione AS descrizione_colore_interno,
            quantita, info, data
            FROM carichi o
            LEFT JOIN articoli a ON o.id_articolo = a.id AND o.id_accessorio IS NULL
            LEFT JOIN accessori acc ON o.id_accessorio = acc.id AND o.id_articolo IS NULL
            LEFT JOIN colori c1 ON o.id_colore_esterno = c1.id
            LEFT JOIN colori c2 ON o.id_colore_interno = c2.id
            WHERE 1 = 1 
            `;
        const parameters = [];

        if(id_prodotto) {
            queryString += " AND COALESCE(UPPER(o.id_articolo), UPPER(o.id_accessorio)) LIKE ?";
            parameters.push(`%${id_prodotto}%`);
        }
        if(id_colore_esterno) {
            queryString += " AND id_colore_esterno LIKE ?";
            parameters.push(`%${id_colore_esterno}%`);
        }
        if(id_colore_interno) {
            queryString += " AND id_colore_interno LIKE ?";
            parameters.push(`%${id_colore_interno}%`);
        }
        if(info) {
            queryString += " AND info LIKE ?";
            parameters.push(`%${info}%`);
        }
        queryString += `
            ORDER BY o.data DESC;
`

        let [rows] = await db.query(queryString, parameters);
        const totalPages = Math.ceil(rows.length * 1.0 / limit); 


        rows = rows.slice(offset, offset + limit);
        res.json({ data: rows, totalPages: totalPages });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.post("/", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const id_prodotto = req.body.id_prodotto.trim();
        const id_colore_esterno = req.body.id_colore_esterno.trim();
        const id_colore_interno = req.body.id_colore_interno.trim();
        const quantita = parseInt(req.body.quantita);
        const data = req.body.data ? new Date(req.body.data) : null;
        const info = req.body.info || '';
        let isAccessorio = false;

        if(!id_prodotto) {
            return res.status(400).send({ field: "errore_id_prodotto", message: "Id prodotto necessario" });
        }
        if(!id_colore_esterno) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id 3 colore esterno necessario" });
        }
        if(!id_colore_interno) {
            isAccessorio = true;
        }
        if(!quantita || quantita <= 0) {
            return res.status(400).send({ field: "errore_quantita", message: "Quantità invalida" });
        }
        if(!data) {
            return res.status(400).send({ field: "errore_data", message: "Data richiesta" })
        }

        let rows;
        if(!isAccessorio) {
            [rows] = await db.query("SELECT id FROM articoli WHERE id = ?", [id_prodotto]);
            if(rows.length <= 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Id profilo non presente in magazzino" })
            }
        }
        else {
            [rows] = await db.query("SELECT id FROM accessori WHERE id = ?", [id_prodotto]);
            if(rows.length <= 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Id accessorio non presente in magazzino" })
            }
        }

        [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_esterno]);
        if(rows.length <= 0) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id colore esterno non presente in magazzino" })
        }
        if(!isAccessorio) {
            [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_interno]);
            if(rows.length <= 0) {
                return res.status(400).send({ field: "errore_id_colore_interno", message: "Id colore interno non presente in magazzino" })
            }
        }

        if(!isAccessorio) {
            await db.execute(
                'INSERT INTO carichi (id_articolo, id_colore_esterno, id_colore_interno, quantita, data, info) VALUES (?,?,?,?,?,?)',
                [id_prodotto, id_colore_esterno, id_colore_interno, quantita, data, info]
            )
        }
        else {
            await db.execute(
                'INSERT INTO carichi (id_accessorio, id_colore_esterno, quantita, data, info) VALUES (?,?,?,?,?)',
                [id_prodotto, id_colore_esterno, quantita, data, info]
            )
        }

        res.status(200).send({ message: "Carico aggiunto con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.post("/:id", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const id = req.params.id || "";
        const id_prodotto = req.body.id_prodotto.trim();
        const id_colore_esterno = req.body.id_colore_esterno.trim();
        const id_colore_interno = req.body.id_colore_interno.trim();
        const quantita = parseInt(req.body.quantita);
        const data = req.body.data ? new Date(req.body.data) : null;
        const info = req.body.info || '';
        let isAccessorio = false;

        if(!id) {
            return res.status(400).send({ field: "errore_id", message: "Id scarico necessario" });
        }
        if(!id_prodotto) {
            return res.status(400).send({ field: "errore_id_prodotto", message: "Id prodotto necessario" });
        }
        if(!id_colore_esterno) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id 4 colore esterno necessario" });
        }
        if(!id_colore_interno) {
            isAccessorio = true;
        }
        if(!quantita || quantita <= 0) {
            return res.status(400).send({ field: "errore_quantita", message: "Quantità invalida" });
        }
        if(!data) {
            return res.status(400).send({ field: "errore_data", message: "Data necessaria" });
        }

        let rows;
        if(!isAccessorio) {
            [rows] = await db.query("SELECT id FROM articoli WHERE id = ?", [id_prodotto]);
            if(rows.length <= 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Id profilo non presente in magazzino" })
            }
        }
        else {
            [rows] = await db.query("SELECT id FROM accessori WHERE id = ?", [id_prodotto]);
            if(rows.length <= 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Id accessorio non presente in magazzino" })
            }
        }

        [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_esterno]);
        if(rows.length <= 0) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id colore esterno non presente in magazzino" })
        }
        if(!isAccessorio) {
            [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_interno]);
            if(rows.length <= 0) {
                return res.status(400).send({ field: "errore_id_colore_interno", message: "Id colore interno non presente in magazzino" })
            }
        }

        let result;
        if(!isAccessorio) {
            result = await db.execute(
                'UPDATE carichi SET id_articolo = ?, id_accessorio = null, id_colore_esterno = ?, id_colore_interno = ?, quantita = ?, data = ?, info = ? WHERE id = ?',
                [id_prodotto, id_colore_esterno, id_colore_interno, quantita, data, info, id]
            )
        }
        else {
            result = await db.execute(
                'UPDATE carichi SET id_articolo = null, id_accessorio = ?, id_colore_esterno = ?, id_colore_interno = null, quantita = ?, data = ?, info = ? WHERE id = ?',
                [id_prodotto, id_colore_esterno, quantita, data, info, id]
            )
        }
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "id", message: "Id carico non presente in magazzino" });
        }

        res.status(200).send({ message: "Carico modificato con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
    }
})
router.post("/elimina/:id", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }

        const id = req.params.id || "";

        if(!id) {
            return res.status(400).send({ field: "errore_id", message: "Id carico necessario" });
        }

        const result = await db.execute("DELETE FROM carichi WHERE id = ?", [id]);
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id carico non presente nel database" });
        }
        return res.status(200).send({ message: "Carico eliminato con successo" });

    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
    }
})

module.exports = router;
