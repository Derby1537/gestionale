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
        const id_prodotto = req.query.id_prodotto?.trim();
        const id_colore_esterno = req.query.id_colore_esterno?.trim();
        const id_colore_interno = req.query.id_colore_interno?.trim();
        const fornitore = req.query.fornitore;
        const descrizione = req.query.descrizione;

        let queryString = `
SELECT 
UPPER(union_result.id_articolo) AS id_prodotto,
UPPER(union_result.id_colore_esterno) AS id_colore_esterno, 
UPPER(union_result.id_colore_interno) AS id_colore_interno,
ce.descrizione AS descrizione_colore_esterno, -- Descrizione del colore esterno
ci.descrizione AS descrizione_colore_interno, -- Descrizione del colore interno
ce.pellicolato AS pellicolato,
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
            queryString += " AND id_articolo LIKE ?";
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
        if (descrizione) {
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
        HAVING id_prodotto IS NOT NULL
`
        let [rows] = await db.query(queryString, parameters);
        const totalPages = Math.ceil(rows.length * 1.0 / limit); 
        const dataToSend = rows.slice(offset, offset + limit);

        for (let i = 0; i < dataToSend.length; i++) {
            if (dataToSend[i].quantita_in_magazzino < 0) {
                dataToSend[i].quantita_in_magazzino = 0;
            }
            dataToSend[i].valore_in_magazzino = 
                (dataToSend[i].pellicolato ? dataToSend[i].prezzo_pellicolato : dataToSend[i].prezzo) *
                dataToSend[i].quantita_in_magazzino * 
                dataToSend[i].lunghezza_barra;
            dataToSend[i].valore_in_magazzino = dataToSend[i].valore_in_magazzino.toFixed(2);
            

            dataToSend[i].valore_in_ordine = 
                (dataToSend[i].pellicolato ? dataToSend[i].prezzo_pellicolato : dataToSend[i].prezzo) *
                dataToSend[i].quantita_in_ordine * 
                dataToSend[i].lunghezza_barra;
            dataToSend[i].valore_in_ordine = dataToSend[i].valore_in_ordine.toFixed(2);
            
        }

        res.json({ data: dataToSend, totalPages: totalPages });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})
router.get("/totale", async (req, res) => {
    try {
        let auth = await checkAuth(req, res)
        if(!auth || auth.role != "admin") {
            return res.status(401).send("Unauthorized");
        }
        let queryString = `
SELECT 
UPPER(union_result.id_articolo) AS id_prodotto,
UPPER(union_result.id_colore_esterno) AS id_colore_esterno, 
UPPER(union_result.id_colore_interno) AS id_colore_interno,
ce.descrizione AS descrizione_colore_esterno, -- Descrizione del colore esterno
ci.descrizione AS descrizione_colore_interno, -- Descrizione del colore interno
ce.pellicolato AS pellicolato,
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

            `;
        const parameters = [];
        queryString += `
        GROUP BY 
            COALESCE(UPPER(union_result.id_articolo), UPPER(union_result.id_accessorio)),
            UPPER(union_result.id_colore_esterno), 
            UPPER(union_result.id_colore_interno),
            COALESCE(a.fornitore, acc.fornitore),
            COALESCE(a.descrizione, acc.descrizione)
        HAVING id_prodotto IS NOT NULL
`
        let [rows] = await db.query(queryString, parameters);
        const dataToSend = [...rows];

        for (let i = 0; i < dataToSend.length; i++) {
            if (dataToSend[i].quantita_in_magazzino < 0) {
                dataToSend[i].quantita_in_magazzino = 0;
            }
            dataToSend[i].valore_in_magazzino = 
                (dataToSend[i].pellicolato ? dataToSend[i].prezzo_pellicolato : dataToSend[i].prezzo) *
                dataToSend[i].quantita_in_magazzino * 
                dataToSend[i].lunghezza_barra;
            dataToSend[i].valore_in_magazzino = dataToSend[i].valore_in_magazzino.toFixed(2);
        }

        res.json({ data: dataToSend });
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
        const id_prodotto = req.body.id_prodotto?.trim() || req.body.q?.trim();
        const id_colore_esterno = req.body.id_colore_esterno?.trim();
        const id_colore_interno = req.body.id_colore_interno?.trim();
        const fornitore = req.body.fornitore;
        const descrizione = req.body.descrizione;

        let queryString = `
SELECT 
UPPER(union_result.id_articolo) AS id_prodotto,
UPPER(union_result.id_colore_esterno) AS id_colore_esterno, 
UPPER(union_result.id_colore_interno) AS id_colore_interno,
ce.descrizione AS descrizione_colore_esterno, -- Descrizione del colore esterno
ci.descrizione AS descrizione_colore_interno, -- Descrizione del colore interno
ce.pellicolato AS pellicolato,
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
            queryString += " AND id_articolo LIKE ?";
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
        if (descrizione) {
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
        HAVING id_prodotto IS NOT NULL
`
        let [rows] = await db.query(queryString, parameters);
        const dataToSend = [...rows];

        for (let i = 0; i < dataToSend.length; i++) {
            if (dataToSend[i].quantita_in_magazzino < 0) {
                dataToSend[i].quantita_in_magazzino = 0;
            }
            dataToSend[i].valore_in_magazzino = 
                (dataToSend[i].pellicolato ? dataToSend[i].prezzo_pellicolato : dataToSend[i].prezzo) *
                dataToSend[i].quantita_in_magazzino * 
                dataToSend[i].lunghezza_barra;
            dataToSend[i].valore_in_magazzino = dataToSend[i].valore_in_magazzino.toFixed(2);
        }

        res.json({ data: dataToSend });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
})

module.exports = router;
