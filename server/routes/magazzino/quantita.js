const express = require("express");
const router = express.Router();
const { db, checkAuth } = require("../../server")

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
        const fornitore = req.query.fornitore;

        let queryString = `
SELECT 
	COALESCE(q.id_articolo, q.id_accessorio) AS id_prodotto,
    COALESCE(ar.fornitore, ac.fornitore) AS fornitore,
    q.quantita_minima,
    UPPER(q.id_colore_esterno) AS id_colore_esterno,
    UPPER(q.id_colore_interno) AS id_colore_interno,
    q.id AS id,
    ce.descrizione AS descrizione_colore_esterno,
    ci.descrizione AS descrizione_colore_interno
FROM quantita q 
LEFT JOIN articoli ar on COALESCE(q.id_articolo, q.id_accessorio) = ar.id
LEFT JOIN accessori ac on COALESCE(q.id_articolo, q.id_accessorio) = ac.id
LEFT JOIN colori ce ON q.id_colore_esterno = ce.id
LEFT JOIN colori ci ON q.id_colore_interno = ci.id
WHERE 1 = 1 
            `;
        const parameters = [];

        if(id_prodotto) {
            queryString += " AND COALESCE(UPPER(q.id_articolo), UPPER(q.id_accessorio)) LIKE ?";
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
        if(fornitore) {
            queryString += " AND COALESCE(ar.fornitore, ac.fornitore) LIKE ?";
            parameters.push(`%${fornitore}%`);
        }

        let [rows] = await db.query(queryString, parameters);
        const totalPages = Math.ceil(rows.length * 1.0 / limit); 
        const dataToSend = rows.slice(offset, offset + limit);
        
        [rows] = await db.query(`
SELECT 
	id_prodotto,
    id_colore_esterno,
    id_colore_interno,
    SUM(quantita_in_magazzino) AS quantita_in_magazzino
FROM (
	SELECT
    	COALESCE (id_articolo, id_accessorio) AS id_prodotto,
    	id_colore_esterno,
    	id_colore_interno,
    	SUM(quantita) AS quantita_in_magazzino
    FROM carichi
    GROUP BY
    	id_prodotto,
    	id_colore_esterno,
    	id_colore_interno

UNION ALL
    SELECT
    	COALESCE (id_articolo, id_accessorio) AS id_prodotto,
    	id_colore_esterno,
    	id_colore_interno,
    	SUM(-quantita) AS quantita_in_magazzino
    FROM scarichi
    GROUP BY
    	id_prodotto,
    	id_colore_esterno,
    	id_colore_interno
    
UNION ALL
    SELECT
    	COALESCE (id_articolo, id_accessorio) AS id_prodotto,
    	id_colore_esterno,
    	id_colore_interno,
    	SUM(quantita) AS quantita_in_magazzino
    FROM ordini
    WHERE consegnato = 1
    GROUP BY
    	id_prodotto,
    	id_colore_esterno,
    	id_colore_interno
) AS union_result
GROUP BY
	id_prodotto,
    id_colore_esterno,
    id_colore_interno
`)
        dataToSend.forEach(item => {
            const match = rows.find(row =>
                row.id_prodotto.toLowerCase() === item.id_prodotto.toLowerCase() &&
                    row.id_colore_esterno.toLowerCase() === item.id_colore_esterno.toLowerCase() &&
                    (!row.id_colore_interno || row.id_colore_interno.toLowerCase() === item.id_colore_interno.toLowerCase())
            );
            item.quantita_in_magazzino = match ? match.quantita_in_magazzino : 0;
        });


        [rows] = await db.query(`
    SELECT
    	COALESCE (id_articolo, id_accessorio) AS id_prodotto,
    	id_colore_esterno,
    	id_colore_interno,
    	SUM(quantita) AS quantita_in_arrivo
    FROM ordini
    WHERE consegnato = 0
    GROUP BY
    	id_prodotto,
    	id_colore_esterno,
    	id_colore_interno
`)
        dataToSend.forEach(item => {
            const match = rows.find(row =>
                row.id_prodotto.toLowerCase() === item.id_prodotto.toLowerCase() &&
                    row.id_colore_esterno.toLowerCase() === item.id_colore_esterno.toLowerCase() &&
                    (!row.id_colore_interno || row.id_colore_interno.toLowerCase() === item.id_colore_interno.toLowerCase())
            );
            item.quantita_in_arrivo = match ? match.quantita_in_arrivo : 0;
        });



        res.json({ data: dataToSend, totalPages: totalPages });
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
        const id_prodotto = req.body.id_prodotto?.trim();
        const id_colore_esterno = req.body.id_colore_esterno?.trim();
        const id_colore_interno = req.body.id_colore_interno?.trim();
        const quantita = parseInt(req.body.quantita_minima) || 0;
        let isAccessorio = false;

        if(!id_prodotto) {
            return res.status(400).send({ field: "errore_id_prodotto", message: "Id prodotto necessario" });
        }
        if(!id_colore_esterno) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id 1 colore esterno necessario" });
        }
        if (!id_colore_interno) {
            isAccessorio = true;
        }
        if (!quantita || quantita < 1) {
            return res.status(400).send({ field: "errore_quantita_minima", message: "Quantità invalida" });
        }


        let [rows] = await db.query("SELECT * FROM colori WHERE id = ?", id_colore_esterno);
        if (rows.length === 0) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id colore esterno non presente nel database" });
        }

        if (!isAccessorio) {
            [rows] = await db.query("SELECT * FROM colori WHERE id = ?", id_colore_interno);
            if (rows.length === 0) {
                return res.status(400).send({ field: "errore_id_colore_interno", message: "Id colore interno non presente nel database" });
            }

            [rows] = await db.query("SELECT * FROM articoli WHERE id = ?", [id_prodotto]);
            if (rows.length === 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Id prodotto non presente nel database" });
            }

            [rows] = await db.query("SELECT * FROM quantita WHERE id_articolo = ? AND id_colore_esterno = ? AND id_colore_interno = ?", [id_prodotto, id_colore_esterno, id_colore_interno]);
            if (rows.length !== 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Tupla per quantità minima già presente nel database" });
            }

            await db.execute(
                `INSERT INTO quantita (id_articolo, id_colore_esterno, id_colore_interno, quantita_minima) VALUES (?,?,?,?)`
                , [id_prodotto, id_colore_esterno, id_colore_interno, quantita]);
        }
        else {
            [rows] = await db.query("SELECT * FROM accessori WHERE id = ?", [id_prodotto]);
            if (rows.length === 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Id prodotto non presente nel database" });
            }

            [rows] = await db.query("SELECT * FROM quantita WHERE id_accessorio = ? AND id_colore_esterno = ?", [id_prodotto, id_colore_esterno]);
            if (rows.length !== 0) {
                return res.status(400).send({ field: "errore_id_prodotto", message: "Tupla per quantità minima già presente nel database" });
            }

            await db.execute(
                `INSERT INTO quantita (id_accessorio, id_colore_esterno,  quantita_minima) VALUES (?,?,?)`
                , [id_prodotto, id_colore_esterno, quantita]);
        }

        res.status(200).send({ message: "Quantità minima aggiunta con successo" });
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
        const id_prodotto = req.body.id_prodotto?.trim();
        const id_colore_esterno = req.body.id_colore_esterno?.trim();
        const id_colore_interno = req.body.id_colore_interno?.trim();
        const quantita = parseInt(req.body.quantita_minima) || 0;
        let isAccessorio = false;

        if(!id) {
            return res.status(400).send({ field: "errore_id", message: "Id quantità minima necessario" });
        }
        if(!id_prodotto) {
            return res.status(400).send({ field: "errore_id_prodotto", message: "Id prodotto necessario" });
        }
        if(!id_colore_esterno) {
            return res.status(400).send({ field: "errore_id_colore_esterno", message: "Id 2 colore esterno necessario" });
        }
        if(!id_colore_interno) {
            isAccessorio = true;
        }
        if(!quantita || quantita <= 0) {
            return res.status(400).send({ field: "errore_quantita_minima", message: "Quantità invalida" });
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
                'UPDATE quantita SET id_articolo = ?, id_accessorio = null, id_colore_esterno = ?, id_colore_interno = ?, quantita_minima = ? WHERE id = ?',
                [id_prodotto, id_colore_esterno, id_colore_interno, quantita, id]
            )
        }
        else {
            result = await db.execute(
                'UPDATE quantita SET id_articolo = null, id_accessorio = ?, id_colore_esterno = ?, id_colore_interno = null, quantita_minima = ? WHERE id = ?',
                [id_prodotto, id_colore_esterno, quantita, id]
            )
        }
        if (result[0].affectedRows === 0) {
            return res.status(400).send({ field: "errore_id_prodotto", message: "Id quantità minima non presente nel database"})
        }

        res.status(200).send({ message: "Quantità minima modificata con successo" });
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
            return res.status(400).send({ field: "errore_id", message: "Id quantità minima necessario" });
        }

        const result = await db.execute("DELETE FROM quantita WHERE id = ?", [id]);
        if(result[0].affectedRows <= 0) {
            return res.status(400).send({ field: "errore_id", message: "Id quantità minima non presente nel database" });
        }
        return res.status(200).send({ message: "Quantità minima eliminata con successo" });

    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal server error" });
    }
})

module.exports = router;
