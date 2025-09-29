const express = require("express");
const router = express.Router();
const { db, checkAuth, formatDate } = require("../../server");
const { checkAuth: checkAuthMiddleware, authorizeRoles } = require("../../middlewares/auth");
const { getVetri, putVetro, deleteVetro, postVetro } = require("../../controllers/ordini/vetri");

router.get("/", checkAuthMiddleware, authorizeRoles("admin"), getVetri);
router.post("/", checkAuthMiddleware, authorizeRoles("admin"), postVetro);
router.put("/:id", checkAuthMiddleware, authorizeRoles("admin"), putVetro);
router.delete("/:id", checkAuthMiddleware, authorizeRoles("admin"), deleteVetro);

router.get("/ordinati", async (req, res) => {
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
        const { riferimento, data_consegna } = req.query;

        let queryString = `
            SELECT *
            FROM vetri_ordinati
            WHERE 1 = 1 
            `;
        const parameters = [];

        if (riferimento) {
            queryString += " AND riferimento LIKE ?";
            parameters.push(`%${riferimento}%`);
        }
        if (data_consegna) {
            queryString += " AND data_consegna = ?";
            parameters.push(formatDate(new Date(data_consegna)));
        }
        queryString += `
            AND consegnato = 0
            ORDER BY ABS(DATEDIFF(data_consegna, CURRENT_DATE)) ASC, riferimento ASC;
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
router.get("/consegnati", async (req, res) => {
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
        const { riferimento, data_consegna } = req.query;

        let queryString = `
            SELECT *
            FROM vetri_ordinati
            WHERE 1 = 1 
            `;
        const parameters = [];

        if (riferimento) {
            queryString += " AND riferimento LIKE ?";
            parameters.push(`%${riferimento}%`);
        }
        if (data_consegna) {
            queryString += " AND data_consegna = ?";
            parameters.push(formatDate(new Date(data_consegna)));
        }
        queryString += `
            AND consegnato = 1
            ORDER BY ABS(DATEDIFF(data_consegna, CURRENT_DATE)) ASC, riferimento ASC;
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
router.post("/aggiungi", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const riferimento = req.body.riferimento?.trim();
        const lotto = req.body.lotto?.trim();
        const numero_vetri = req.body.numero_vetri ? parseInt(req.body.numero_vetri) : 0;
        const data = req.body.data_consegna ? new Date(req.body.data_consegna) : null;
        const consegnato = req.body.consegnato == true ? true : false;
        console.log(consegnato, req.body.consegnato);

        if(!riferimento) {
            return res.status(400).send({ field: "errore_riferimento", message: "Riferimento necessario" });
        }
        if(!lotto) {
            return res.status(400).send({ field: "errore_lotto", message: "Lotto necessario" });
        }
        if(numero_vetri <= 0) {
            return res.status(400).send({ field: "errore_numero_vetri", message: "Quantità invalida" });
        }
        if(!data) {
            return res.status(400).send({ field: "errore_data", message: "Data richiesta" })
        }

        let rows;
        [rows] = await db.query("SELECT numero_ordine FROM lista_ordini WHERE numero_ordine = ?", [riferimento]);
        if(rows.length <= 0) {
            return res.status(400).send({ field: "errore_riferimento", message: "Numero ordine non presente in magazzino" })
        }

        await db.execute(
            'INSERT INTO vetri_ordinati (numero_vetri, riferimento, lotto, data_consegna, consegnato) VALUES (?,?,?,?,?)',
            [numero_vetri, riferimento, lotto, data, consegnato ? 1 : 0]
        )

        res.status(200).send({ message: "Ordine per il vetro aggiunto con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.post("/consegna/:id", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const id = req.body.id || req.params.id;
        if(!id) {
            return res.status(400).send({ field: "errore_id", message: "Id ordine necessario" });
        }

        const result = await db.execute(`UPDATE vetri_ordinati SET consegnato = 1 WHERE id = ?`, [id]);
        if(result[0].affectedRows <= 0) {
            throw Error();
        }

        res.status(200).send({ message: "Consegna confermata con successo" });
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
        const riferimento = req.body.riferimento?.trim();
        const numero_vetri = req.body.numero_vetri ? parseInt(req.body.numero_vetri) : 0;
        const data = req.body.data_consegna ? new Date(req.body.data_consegna) : null;
        const consegnato = req.body.consegnato;

        if(!id) {
            return res.status(400).send({ field: "errore_id", message: "Id scarico necessario" });
        }
        if(!riferimento) {
            return res.status(400).send({ field: "errore_riferimento", message: "Riferimento necessario" });
        }
        if(!data) {
            return res.status(400).send({ field: "errore_data", message: "Data consegna necessaria" });
        }
        if (numero_vetri <= 0) {
            return res.status(400).send({ field: "errore_numero_vetri", message: "Quantità invalida" });
        }

        let rows;
        [rows] = await db.query("SELECT id FROM vetri_ordinati WHERE id = ?", [id]);
        if(rows.length <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id ordine del vetro non presente in magazzino" })
        }

        let result;
        result = await db.execute(
            'UPDATE vetri_ordinati SET riferimento = ?, numero_vetri = ?, data_consegna = ?, consegnato = ? WHERE id = ?',
            [riferimento, numero_vetri, data, consegnato == false ? false : true, id]
        )
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id ordine del vetro non presente in magazzino" });
        }

        res.status(200).send({ message: "Ordine del vetro modificato con successo" });
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
            return res.status(400).send({ field: "errore_id", message: "Id ordine del vetro necessario" });
        }

        const result = await db.execute("DELETE FROM vetri_ordinati WHERE id = ?", [id]);
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id carico non presente nel database" });
        }
        return res.status(200).send({ message: "Ordine del vetro eliminato con successo" });

    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
    }
})

module.exports = router;
