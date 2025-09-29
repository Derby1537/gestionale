const express = require('express');
const router = express.Router();
const { db, checkAuth } = require("../../server.js")

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
        const id_prodotto = req.query.id || "";
        const descrizione = req.query.descrizione || "";
        const fornitore = req.query.fornitore || "";

        let queryString = `
            SELECT *, UPPER(id) as id
            FROM articoli
            WHERE 1 = 1 
            `;
        const parameters = [];

        if(id_prodotto) {
            queryString += " AND id LIKE ?";
            parameters.push(`%${id_prodotto}%`);
        }
        if(descrizione) {
            queryString += " AND descrizione LIKE ?";
            parameters.push(`%${descrizione}%`);
        }
        if(fornitore) {
            queryString += " AND fornitore LIKE ?";
            parameters.push(`%${fornitore}%`);
        }

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
        const id_prodotto = req.body.id.trim();
        const fornitore = req.body.fornitore || '';
        const descrizione = req.body.descrizione || '';
        const lunghezza_barra = parseFloat(req.body.lunghezza_barra) || 0;
        const prezzo_in_massa = parseFloat(req.body.prezzo) || 0;
        const prezzo_pellicolato = parseFloat(req.body.prezzo_pellicolato) || 0;

        if(!id_prodotto) {
            return res.status(400).send({ field: "errore_id", message: "Id prodotto necessario" });
        }
        if(!lunghezza_barra || lunghezza_barra <= 0) {
            return res.status(400).send({ field: "errore_lunghezza_barra", message: "Lunghezza barra invalida" });
        }
        if(prezzo_in_massa && prezzo_in_massa < 0) {
            return res.status(400).send({ field: "errore_prezzo", message: "Prezzo in massa invalido" })
        }
        if(prezzo_pellicolato && prezzo_pellicolato < 0) {
            return res.status(400).send({ field: "errore_prezzo_pellicolato", message: "Prezzo pellicolato invalido" })
        }

        let [rows] = await db.query("SELECT id FROM articoli WHERE id = ?", [id_prodotto]);
        if(rows.length > 0) {
            return res.status(400).send({ field: "errore_id", message: "Id profilo già presente in magazzino" })
        }

        await db.execute(
            `INSERT INTO articoli (id, descrizione, fornitore, lunghezza_barra, prezzo, prezzo_pellicolato) VALUES (?,?,?,?,?,?)`
            , [id_prodotto, descrizione, fornitore, lunghezza_barra, prezzo_in_massa, prezzo_pellicolato]);


        res.status(200).send({ message: "Profilo aggiunto con successo" });
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
        const fornitore = req.body.fornitore || '';
        const descrizione = req.body.descrizione || '';
        const lunghezza_barra = parseFloat(req.body.lunghezza_barra) || 0;
        const prezzo_in_massa = parseFloat(req.body.prezzo) || 0;
        const prezzo_pellicolato = parseFloat(req.body.prezzo_pellicolato) || 0;

        if(!id) {
            return res.status(400).send({ field: "errore_id", message: "Id profilo necessario" });
        }
        if(!lunghezza_barra || lunghezza_barra <= 0) {
            return res.status(400).send({ field: "errore_lunghezza_barra", message: "Lunghezza barra invalida" });
        }
        if(prezzo_in_massa && prezzo_in_massa < 0) {
            return res.status(400).send({ field: "errore_prezzo", message: "Prezzo in massa invalido" })
        }
        if(prezzo_pellicolato && prezzo_pellicolato < 0) {
            return res.status(400).send({ field: "errore_prezzo_pellicolato", message: "Prezzo pellicolato invalido" })
        }

        const result = await db.execute(
            'UPDATE articoli SET descrizione = ?, fornitore = ?, lunghezza_barra = ?, prezzo = ?, prezzo_pellicolato = ? WHERE id = ?',
            [descrizione, fornitore, lunghezza_barra, prezzo_in_massa, prezzo_pellicolato, id]
        )
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id profilo non presente in magazzino" });
        }

        res.status(200).send({ message: "Profilo modificato con successo" });
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
            return res.status(400).send({ field: "errore_id", message: "Id profilo necessario" });
        }

        const result = await db.execute("DELETE FROM articoli WHERE id = ?", [id]);
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id profilo non presente nel database" });
        }
        return res.status(200).send({ message: "Profilo eliminato con successo" });

    }
    catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            const errorMessage = 'Devi eliminare tutti gli ordini/carichi/scarichi collegati a questo profilo prima di poterlo eliminare.';
            res.status(404).send({ message: errorMessage });
        } else {
            console.error(e);
            res.status(500).send('Internal Server Error');
        }
    }
})

module.exports = router;
