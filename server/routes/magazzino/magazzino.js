const express = require('express');
const router = express.Router();
const { db } = require("../../server.js")

router.get("/", async (req, res) => {
    try {
        let limit = parseInt(req.query.limit) || 25;
        if(limit <= 0) limit = 25;
        let page = parseInt(req.query.page) || 1;
        if(page <= 0) page = 1;
        const offset = (page - 1) * limit;
        const id_prodotto = req.query.id_prodotto;
        const id_colore_esterno = req.query.id_colore_esterno;
        const id_colore_interno = req.query.id_colore_interno;
        const fornitore = req.query.fornitore;
        const descrizione = req.query.descrizione;

        let queryString = `
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
WHERE 1 = 1 
            `;
        const parameters = [];

        if(id_prodotto) {
            queryString += " AND COALESCE(union_result.id_articolo, union_result.id_accessorio) LIKE ?";
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
            queryString += " AND COALESCE(a.fornitore, acc.fornitore) LIKE ?";
            parameters.push(`%${fornitore}%`);
        }
        if(descrizione) {
            queryString += " AND COALESCE(a.descrizione, acc.descrizione) LIKE ?";
            parameters.push(`%${descrizione}%`);
        }
        queryString += `
        GROUP BY 
            COALESCE(UPPER(union_result.id_articolo), UPPER(union_result.id_accessorio)),
            UPPER(union_result.id_colore_esterno), 
            UPPER(union_result.id_colore_interno),
            COALESCE(a.fornitore, acc.fornitore),
            COALESCE(a.descrizione, acc.descrizione)
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

router.get("/descrizione", async (req, res) => {
    try {
        const id_prodotto = req.query.id_prodotto.trim() || "";
        const id_colore_esterno = req.query.id_colore_esterno.trim().toLowerCase() || "";
        const id_colore_interno = req.query.id_colore_interno.trim().toLowerCase() || "";
        const descToReturn = { descrizione: "", descrizione_colore_esterno: "", descrizione_colore_interno: "" };

        let [rows] = await db.query(`
        SELECT COALESCE(art.descrizione, acc.descrizione) AS descrizione
        FROM articoli art JOIN accessori acc
        WHERE art.id = ? OR acc.id = ?
        `, [id_prodotto, id_prodotto]);
        descToReturn.descrizione = rows[0]?.descrizione || "";

        [rows] = await db.query("SELECT descrizione FROM colori WHERE id = ?", [id_colore_esterno]);
        descToReturn.descrizione_colore_esterno = rows[0]?.descrizione || "";

        descToReturn.descrizione_colore_interno = descToReturn.descrizione_colore_esterno;
        if(id_colore_esterno !== id_colore_interno) {
            [rows] = await db.query("SELECT descrizione FROM colori WHERE id = ?", [id_colore_interno]);
            descToReturn.descrizione_colore_interno = rows[0]?.descrizione || "";
        }

        res.json(descToReturn);
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
})

module.exports = router;
