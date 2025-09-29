const express = require('express');
const router = express.Router();
const { db, checkAuth, formatDate } = require("../../server.js")

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
        const {
            lotto,
            nome_lotto,
            inizio_produzione,
            profilo,
        } = req.query;

        let queryString = `
SELECT * FROM lotto
WHERE 1 = 1
            `;
        const parameters = [];

        if (lotto?.trim()) {
            queryString += " AND numero_lotto LIKE ?";
            parameters.push(`%${lotto}%`);
        }
        if (nome_lotto?.trim()) {
            queryString += " AND nome LIKE ?";
            parameters.push(`%${nome_lotto}%`);
        }
        if (inizio_produzione) {
            queryString += " AND inizio_produzione = ?";
            parameters.push(formatDate(new Date(inizio_produzione)));
        }
        if (profilo?.trim()) {
            queryString += " AND profilo LIKE ?";
            parameters.push(`%${profilo}%`);
        }

        queryString += "\nORDER BY numero_lotto DESC"

        let [rows] = await db.query(queryString, parameters);
        const totalPages = Math.ceil(rows.length * 1.0 / limit); 


        rows = rows.slice(offset, offset + limit);

        for(const row of rows) {
            row.numero_infissi = 0;
            row.numero_cassonetti = 0;

            let [result] = await db.query(`
SELECT *
FROM lista_ordini o
WHERE o.lotto_infissi = ?;`, 
                [row.numero_lotto]);
            row.ordini = [];

            let numero_infissi = 0;
            let numero_cassonetti = 0;

            for (let i = 0; i < result.length; i++) {
                numero_infissi += result[i].numero_infissi
                if (result[i].lotto_infissi === result[i].lotto_cassonetti) {
                    numero_cassonetti += result[i].numero_cassonetti
                }
                else {
                    result[i].numero_cassonetti = 0;
                }
                row.ordini.push(result[i]);
            }

            [result] = await db.query(`
SELECT *
FROM lista_ordini o
WHERE o.lotto_cassonetti = ?;`, 
                [row.numero_lotto]);

            for (let i = 0; i < result.length; i++) {
                if (result[i].lotto_infissi === result[i].lotto_cassonetti) {
                    continue;
                }
                numero_cassonetti += result[i].numero_cassonetti;
                result[i].numero_infissi = 0;
                row.ordini.push(result[i]);
            }


            row.numero_infissi = numero_infissi;
            row.numero_cassonetti = numero_cassonetti;
        }

        res.json({ data: rows, totalPages: totalPages });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.post("/aggiungi/nuovo_lotto", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const numero_lotto = req.body.numero_lotto ? parseInt(req.body.numero_lotto) : null;
        const nome = req.body.nome || '';
        const profilo = req.body.profilo || '';
        const inizio_produzione = req.body.inizio_produzione ? new Date(req.body.inizio_produzione) : null;

        if(!numero_lotto) {
            return res.status(400).send({ field: "errore_lotto", message: "Numero lotto necessario" });
        }
        if(!inizio_produzione) {
            return res.status(400).send({ field: "errore_inizio_produzione", message: "Data inizio produzione necessaria" });
        }

        let [rows] = await db.query("SELECT * FROM lotto WHERE numero_lotto = ?", [numero_lotto]);
        if(rows.length > 0) {
            return res.status(400).send({ field: "errore_lotto", message: "Numero lotto già presente nel magazzino" })
        }

        await db.execute(
            `INSERT INTO lotto (numero_lotto, nome, profilo, inizio_produzione) VALUES (?,?,?,?)`
            , [numero_lotto, nome, profilo, inizio_produzione]);


        res.status(200).send({ message: "Lotto aggiunto con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.post("/modifica/:id", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const id = req.params.id;
        const numero_lotto = req.body.numero_lotto ? parseInt(req.body.numero_lotto) : null;
        const nome = req.body.nome || '';
        const profilo = req.body.profilo || '';
        const inizio_produzione = req.body.inizio_produzione ? new Date(req.body.inizio_produzione) : null;

        if(!numero_lotto) {
            return res.status(400).send({ field: "errore_lotto", message: "Numero lotto necessario" });
        }
        if(!inizio_produzione) {
            return res.status(400).send({ field: "errore_inizio_produzione", message: "Data inizio produzione necessaria" });
        }

        if (numero_lotto != id) {
            let [rows] = await db.query("SELECT * FROM lotto WHERE numero_lotto = ?", [numero_lotto]);
            if(rows.length > 0) {
                return res.status(400).send({ field: "errore_lotto", message: "Numero lotto già presente in magazzino" })
            }
        }

        [rows] = await db.execute(
            `UPDATE lotto SET numero_lotto = ?, nome = ?, profilo = ?, inizio_produzione = ? WHERE numero_lotto = ?`
            , [numero_lotto, nome, profilo, inizio_produzione, id]);

        if (rows.affectedRows === 0) {
            return res.status(400).send({ field: "errore_lotto", message: "Numero lotto non presente in magazzino" })
        }

        res.status(200).send({ message: "Lotto modificato con successo" });
    }
    catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            const errorMessage = 'Devi eliminare tutti gli ordini collegati a questo lotto prima di poter modificare il numero lotto.';
            res.status(404).send({ message: errorMessage });
        } else {
            console.error(e);
            res.status(500).send('Internal Server Error');
        }
    }
})
router.post("/ordini/elimina/:id", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const id = req.params.id;
        const riferimento = req.body.riferimento;

        if(!riferimento) {
            return res.status(400).send({ field: "errore_riferimento", message: "Riferimento ordine necessario" });
        }

        const [rows] = await db.query("SELECT * FROM lista_ordini WHERE numero_ordine = ?", [riferimento]);

        if (rows.length === 0) {
            return res.status(400).send({ field: "errore_riferimento", message: "Riferimento non presente nel database" });
        }

        let isInfissi = 0;
        if (rows[0].lotto_infissi == id) {
            isInfissi++;
            if (rows[0].lotto_cassonetti == id) {
                isInfissi++;
            }
        }

        let queryString = "UPDATE lista_ordini SET ";
        switch (isInfissi) {
            case 0:
                queryString += "lotto_cassonetti = null";
                break;
            case 1:
                queryString += "lotto_infissi = null";
                break;
            case 2:
                queryString += "lotto_infissi = null, lotto_cassonetti = null";
                break;
        }
        queryString += " WHERE numero_ordine = ?";

        await db.execute(queryString, [riferimento]);


        res.status(200).send({ message: "Ordine rimosso dal lotto con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
router.post("/elimina/:id", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }

        const { id } = req.params;

        if(!id) {
            return res.status(400).send({ field: "errore_lotto", message: "Numero lotto necessario" });
        }

        const result = await db.execute("DELETE FROM lotto WHERE numero_lotto = ?", [id]);
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_lotto", message: "Numero lotto non presente nel database" });
        }
        return res.status(200).send({ message: "Lotto eliminato con successo" });

    }
    catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            const errorMessage = 'Devi eliminare tutti gli ordini collegati a questo lotto prima di poterlo eliminare.';
            res.status(404).send({ message: errorMessage });
        } else {
            console.error(e);
            res.status(500).send('Internal Server Error');
        }
    }
})

module.exports = router;
