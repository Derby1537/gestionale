const express = require('express');
const router = express.Router();
const { db, checkAuth, formatDate } = require("../../server.js")
const { checkAuth: checkAuthMiddlerware, authorizeRoles } = require("../../middlewares/auth.js");
const { getPezzi } = require('../../controllers/ordini/ordini.js');

router.get("/pezzi", checkAuthMiddlerware, authorizeRoles("admin"), getPezzi);

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
            numero_ordine,
            numero_cliente,
            data,
            ok_prod,
            id_colore_esterno,
            id_colore_interno,
            profilo,
            consegna_vetri,
            consegna_profili,
            produzione
        } = req.query;

        let queryString = `
SELECT 
    lo.numero_ordine,
    lo.data_consegna,
    lo.numero_cliente,
    lo.data,
    lo.ok_prod,
    lo.id_colore_esterno,
    lo.id_colore_interno,
    lo.numero_infissi,
    lo.numero_cassonetti,
    lo.lotto_infissi, 
    lo.lotto_cassonetti,
    ce.fornitore as profilo,
    ce.descrizione as descrizione_id_colore_esterno,
    ci.descrizione as descrizione_id_colore_interno,
    o.data_consegna AS consegna_profili,
    v.data_consegna AS consegna_vetri
FROM lista_ordini lo
LEFT JOIN colori ce ON ce.id = lo.id_colore_esterno 
LEFT JOIN colori ci ON ci.id = lo.id_colore_interno 
LEFT JOIN ordini o 
    ON o.riferimento = lo.numero_ordine
    AND o.data_consegna = (
        SELECT MAX(o2.data_consegna)
        FROM ordini o2
        WHERE o2.riferimento = lo.numero_ordine
    )
LEFT JOIN vetri_ordinati v 
    ON v.riferimento = lo.numero_ordine
    AND v.data_consegna = (
        SELECT MAX(v2.data_consegna)
        FROM vetri_ordinati v2
        WHERE v2.riferimento = lo.numero_ordine
    )
WHERE 1 = 1
            `;
        const parameters = [];

        if (numero_ordine?.trim()) {
            queryString += " AND numero_ordine LIKE ?";
            parameters.push(`%${numero_ordine}%`);
        }
        if (numero_cliente?.trim()) {
            queryString += " AND numero_cliente LIKE ?";
            parameters.push(`%${numero_cliente}%`);
        }
        if (data) {
            queryString += " AND data = ?";
            parameters.push(formatDate(new Date(data)));
        }
        if (ok_prod && ok_prod !== "null") {
            queryString += " AND ok_prod = ?"
            parameters.push(ok_prod);
        }
        if (id_colore_esterno?.trim()) {
            queryString += " AND lo.id_colore_esterno LIKE ?";
            parameters.push(`%${id_colore_esterno}%`);
        }
        if (id_colore_interno?.trim()) {
            queryString += " AND lo.id_colore_interno LIKE ?";
            parameters.push(`%${id_colore_interno}%`);
        }
        if (profilo?.trim()) {
            queryString += " AND ce.fornitore LIKE ?";
            parameters.push(`%${profilo}%`);
        }
        if (consegna_vetri) {
            queryString += " AND v.data_consegna = ?";
            parameters.push(formatDate(new Date(consegna_vetri)));
        }
        if (consegna_profili) {
            queryString += " AND o.data_consegna = ?";
            parameters.push(formatDate(new Date(consegna_profili)));
        }
        if (produzione && produzione === "0") {
            queryString += `
            AND (
                (
                    numero_infissi > 0 AND numero_cassonetti > 0
                    AND (
                        lotto_infissi IS NULL
                        OR lotto_cassonetti IS NULL
                    )
                )
                OR (
                    numero_infissi > 0
                    AND lotto_infissi IS NULL
                )
                OR (
                    numero_cassonetti > 0
                    AND lotto_cassonetti IS NULL
                ) 
            )
            `;
        }
        if (produzione && produzione === "1") {
            queryString += `
            AND (
                (numero_infissi > 0 AND lotto_infissi IS NOT NULL)
                OR (numero_infissi = 0)
            )
            AND (
                (numero_cassonetti > 0 AND lotto_cassonetti IS NOT NULL)
                OR (numero_cassonetti = 0)
            )
            `;
        }

        queryString += `
GROUP BY numero_ordine 
ORDER BY 
  CASE 
    WHEN lo.id_colore_esterno = '00' THEN 1
    WHEN lo.id_colore_esterno = 'ws' THEN 2
    WHEN lo.id_colore_interno = '00' THEN 3
    WHEN lo.id_colore_interno = 'ws' THEN 4
    ELSE 5
  END,
  COALESCE(o.data_consegna, data) ASC
`


        let [rows] = await db.query(queryString, parameters);
        const totalPages = Math.ceil(rows.length * 1.0 / limit); 

        let infissi = 0;
        let cassonetti = 0;
        for (let i = 0; i < rows.length; i++) {
            infissi += rows[i].numero_infissi;
            cassonetti += rows[i].numero_cassonetti;
        }


        rows = rows.slice(offset, offset + limit);
        res.json({ data: rows, totalPages: totalPages, infissi, cassonetti });
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
        const numero_ordine = req.body.numero_ordine?.trim();
        let data_consegna = req.body.data_consegna?.trim();
        const numero_cliente = req.body.numero_cliente || '';
        const id_colore_esterno = req.body.id_colore_esterno?.trim();
        const id_colore_interno = req.body.id_colore_interno?.trim();
        const numero_infissi = parseInt(req.body.numero_infissi || 0);
        const numero_cassonetti = parseInt(req.body.numero_cassonetti || 0);
        const ok_prod = req.body.ok_prod;

        if(!numero_ordine) {
            return res.status(400).send({ field: "errore_numero_ordine", message: "Numero d'ordine necessario" });
        }
        if(!id_colore_esterno) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id 7 colore esterno necessario" });
        }
        if(!id_colore_interno) {
            return res.status(400).send({ field: "errore_id_colore_interno", message: "Id colore interno necessario" });
        }
        if(numero_infissi < 0) {
            return res.status(400).send({ field: "errore_infissi", message: "Numero infissi invalido" });
        }
        if(numero_cassonetti < 0) {
            return res.status(400).send({ field: "errore_cassonetti", message: "Numero cassonetti invalido" });
        }
        if (numero_cassonetti === 0 && numero_infissi === 0) {
            return res.status(400).send({ field: "errore_infissi", message: "Numero infissi invalido" });
        }

        if (data_consegna) {
            data_consegna = new Date(data_consegna);
        }

        let [rows] = await db.query("SELECT numero_ordine FROM lista_ordini WHERE numero_ordine = ?", [numero_ordine]);
        if(rows.length > 0) {
            return res.status(400).send({ field: "errore_numero_ordine", message: "Numero d'ordine già presente nel database" })
        }

        [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_esterno]);
        if (rows.length === 0) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id colore esterno non presente nel database" })
        }
        [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_interno]);
        if (rows.length === 0) {
            return res.status(400).send({ field: "errore_id_colore_interno", message: "Id colore interno non presente nel database" })
        }

        await db.execute(
            `INSERT INTO lista_ordini (numero_ordine, data_consegna, numero_cliente, id_colore_esterno, id_colore_interno, numero_infissi, numero_cassonetti, ok_prod, data) VALUES (?,?,?,?,?,?,?,?,DEFAULT)`
            , [numero_ordine, data_consegna || null, numero_cliente, id_colore_esterno, id_colore_interno, numero_infissi, numero_cassonetti, ok_prod ? true : false]);


        res.status(200).send({ message: "Ordine aggiunto con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.post("/:numero_ordine", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const numero_ordine = req.params.numero_ordine;
        let data_consegna = req.body.data_consegna?.trim();
        const numero_cliente = req.body.numero_cliente || '';
        const id_colore_esterno = req.body.id_colore_esterno?.trim();
        const id_colore_interno = req.body.id_colore_interno?.trim();
        const numero_infissi = parseInt(req.body.numero_infissi || 0);
        const numero_cassonetti = parseInt(req.body.numero_cassonetti || 0);
        const ok_prod = req.body.ok_prod;

        if(!numero_ordine) {
            return res.status(400).send({ field: "errore_numero_ordine", message: "Numero d'ordine necessario" });
        }
        if(!id_colore_esterno) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id 8 colore esterno necessario" });
        }
        if(!id_colore_interno) {
            return res.status(400).send({ field: "errore_id_colore_interno", message: "Id colore interno necessario" });
        }
        if(numero_infissi < 0) {
            return res.status(400).send({ field: "errore_infissi", message: "Numero infissi invalido" });
        }
        if(numero_cassonetti < 0) {
            return res.status(400).send({ field: "errore_cassonetti", message: "Numero cassonetti invalido" });
        }
        if (numero_cassonetti === 0 && numero_infissi === 0) {
            return res.status(400).send({ field: "errore_infissi", message: "Numero infissi invalido" });
        }
        console.log(req.body.data_consegna);
        if (data_consegna) {
            data_consegna = new Date(data_consegna);
        }

        [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_esterno]);
        if (rows.length === 0) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id colore esterno non presente in magazzino" })
        }
        [rows] = await db.query("SELECT id FROM colori WHERE id = ?", [id_colore_interno]);
        if (rows.length === 0) {
            return res.status(400).send({ field: "errore_id_colore_interno", message: "Id colore interno non presente in magazzino" })
        }

        [rows] = await db.execute(
            `UPDATE lista_ordini SET numero_cliente = ?, data_consegna = ?, id_colore_esterno = ?, id_colore_interno = ?, numero_infissi = ?, numero_cassonetti = ?, ok_prod = ? WHERE numero_ordine = ?`
            , [numero_cliente, data_consegna || null, id_colore_esterno, id_colore_interno, numero_infissi, numero_cassonetti, ok_prod ? true : false, numero_ordine]);

        if (rows.affectedRows === 0) {
            return res.status(400).send({ field: "errore_numero_ordine", message: "Numero d'ordine non presente in magazzino" })
        }

        res.status(200).send({ message: "Ordine modificato con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.post("/lotti/:numero_ordine", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        const id = req.params.numero_ordine;
        const lotto_infissi = parseInt(req.body.lotto_infissi) || null;
        const lotto_cassonetti = parseInt(req.body.lotto_cassonetti) || null;

        let rows;
        if (lotto_infissi) {
            [rows] = await db.query("SELECT * FROM lotto WHERE numero_lotto = ?", [lotto_infissi]);
            if(rows.length === 0) {
                return res.status(400).send({ field: "errore_lotto_infissi", message: "Numero lotto non presente nel magazzino" })
            }
        }
        if (lotto_cassonetti) {
            [rows] = await db.query("SELECT * FROM lotto WHERE numero_lotto = ?", [lotto_cassonetti]);
            if(rows.length === 0) {
                return res.status(400).send({ field: "errore_lotto_cassonetti", message: "Numero lotto non presente nel magazzino" })
            }

        }

        await db.execute(
            `UPDATE lista_ordini SET lotto_infissi = ?, lotto_cassonetti = ? WHERE numero_ordine = ?`
            , [lotto_infissi, lotto_cassonetti, id]);


        res.status(200).send({ message: "Lotti aggiunti all'ordine con successo" });
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})
router.post("/elimina/:numero_ordine", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }

        const { numero_ordine } = req.params;

        if(!numero_ordine) {
            return res.status(400).send({ field: "errore_numero_ordine", message: "Numero d'ordine necessario" });
        }

        const result = await db.execute("DELETE FROM lista_ordini WHERE numero_ordine = ?", [numero_ordine]);
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_numero_ordine", message: "Numero d'ordine non presente nel database" });
        }
        return res.status(200).send({ message: "Ordine eliminato con successo" });

    }
    catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            const errorMessage = 'Devi eliminare tutti gli ordini/carichi/scarichi collegati a questo ordine prima di poterlo eliminare.';
            res.status(404).send({ message: errorMessage });
        } else {
            console.error(e);
            res.status(500).send('Internal Server Error');
        }
    }
})

module.exports = router;
