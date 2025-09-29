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
        const id_prodotto = req.query.id || "";
        const descrizione = req.query.descrizione || "";
        const pellicolato = req.query.pellicolato;

        let queryString = `
            SELECT *, UPPER(id) as id
            FROM colori
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
        if (pellicolato !== null && pellicolato !== "null") {
            queryString += " AND pellicolato = ?";
            parameters.push(`${pellicolato}`);
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
        const descrizione = req.body.descrizione || '';
        const fornitore = req.body.fornitore?.trim() || "";
        const pellicolato = req.body.pellicolato;

        if(!id_prodotto) {
            return res.status(400).send({ field: "errore_id", message: "Id colore necessario" });
        }

        let [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_prodotto]);
        if(rows.length > 0) {
            return res.status(400).send({ field: "errore_id", message: "Id colore già presente in magazzino" })
        }

        await db.execute(
            `INSERT INTO colori (id, descrizione, fornitore, pellicolato) VALUES (?,?,?,?)`
            , [id_prodotto, descrizione, fornitore, pellicolato != false ? 1 : 0]);


        res.status(200).send({ message: "Accessorio aggiunto con successo" });
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
        const descrizione = req.body.descrizione || '';
        const pellicolato = req.body.pellicolato;
        const fornitore = req.body.fornitore?.trim() || '';

        if(!id) {
            return res.status(400).send({ field: "errore_id", message: "Id colore necessario" });
        }

        const result = await db.execute(
            'UPDATE colori SET descrizione = ?, fornitore = ?, pellicolato = ? WHERE id = ?',
            [descrizione, fornitore, pellicolato != false ? 1 : 0, id]
        )
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id colore non presente in magazzino" });
        }

        res.status(200).send({ message: "Colore modificato con successo" });
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
            return res.status(400).send({ field: "errore_id", message: "Id colore necessario" });
        }

        const result = await db.execute("DELETE FROM colori WHERE id = ?", [id]);
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id colori non presente nel database" });
        }
        return res.status(200).send({ message: "Colore eliminato con successo" });

    }
    catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            const errorMessage = 'Devi eliminare tutti gli ordini/carichi/scarichi collegati a questo colore prima di poterlo eliminare.';
            res.status(404).send({ message: errorMessage });
        } else {
            console.error(e);
            res.status(500).send('Internal Server Error');
        }
    }
})

module.exports = router;
