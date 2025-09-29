const { db } = require("../../server");

module.exports.getElencoQr = async (req, res) => {
    try {
        const {
            q,
            lotto,
            id_prodotto,
            id_colore_esterno,
            id_colore_interno,
            page = 1,
            limit = 25,
            sort_by,
            sort_order,
            status = "partial",
        } = req.query;

        const pageInt = parseInt(page, 10) || 1;
        const limitInt = parseInt(limit, 10) || 25;
        const offset = (pageInt - 1) * limitInt

        const filters = [];
        const havingFilters = [];
        const values = [];

        if (q) {
            filters.push("CAST(e.lotto AS CHAR) LIKE ? OR e.id_prodotto LIKE ? OR e.id_colore_esterno LIKE ? or e.id_colore_interno LIKE ?");
            values.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }
        if (lotto) {
            filters.push("CAST(e.lotto AS CHAR) LIKE ?");
            values.push(`%${lotto}%`);
        }
        if (id_prodotto) {
            filters.push("e.id_prodotto LIKE ?");
            values.push(`%${id_prodotto}%`);
        }
        if (id_colore_esterno) {
            filters.push("e.id_colore_esterno LIKE ?");
            values.push(`%${id_colore_esterno}%`);
        }
        if (id_colore_interno) {
            filters.push("e.id_colore_interno LIKE ?");
            values.push(`%${id_colore_interno}%`);
        }
        if (status) {
            switch  (status) {
                case "partial":
                    havingFilters.push("quantita_totale > quantita_scaricata");
                    break;
                case "complete":
                    havingFilters.push("quantita_totale <= quantita_scaricata");
                    break;
            }
        }
        const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
        const havingClause = havingFilters.length > 0 ? `HAVING ${havingFilters.join(" AND ")}` : "";

        const countQuery = 
            `
SELECT 
	e.lotto,
    sum(e.quantita_totale) as quantita_totale,
    COALESCE(sum(s.quantita_scaricata), 0) as quantita_scaricata
FROM (
    SELECT 
    	e.lotto, 
    	e.id_prodotto, 
    	e.id_colore_esterno, 
    	e.id_colore_interno, 
    	sum(e.quantita) as quantita_totale
    FROM elenco_qr e
    GROUP BY e.lotto, e.id_prodotto, e.id_colore_esterno, e.id_colore_interno
) as e LEFT JOIN (
	SELECT 
    	s.lotto, 
    	COALESCE(s.id_articolo, s.id_accessorio) as id_prodotto, 
    	s.id_colore_esterno, 
    	s.id_colore_interno, 
    	sum(s.quantita) as quantita_scaricata
    FROM scarichi s
    GROUP BY s.lotto, COALESCE(s.id_articolo, s.id_accessorio), s.id_colore_esterno, s.id_colore_interno
) as s ON (
	e.lotto = s.lotto AND
    e.id_prodotto = s.id_prodotto AND
  	e.id_colore_esterno = s.id_colore_esterno AND
    e.id_colore_interno = s.id_colore_interno
)
${whereClause}
GROUP BY lotto
${havingClause}
`
        const [countRows] = await db.query(countQuery, values);
        // if (countRows.length === 0) {
        //     return res.json({});
        // }
        const totalItems = countRows.length;
        const totalPages = Math.ceil(totalItems / limitInt)

        let sortBy = "lotto";
        let sortOrder = "DESC";
        if (["lotto", "quantita_totale", "quantita_scaricata"].includes(sort_by)) {
            sortBy = sort_by;
        }
        if (sort_order && sort_order.toLowerCase() === "asc") {
            sortOrder = "ASC";
        }

        const lottoQuery = 
            `
SELECT 
	e.lotto,
    sum(e.quantita_totale) as quantita_totale,
    COALESCE(sum(s.quantita_scaricata), 0) as quantita_scaricata
FROM (
    SELECT 
    	e.lotto, 
    	e.id_prodotto, 
    	e.id_colore_esterno, 
    	e.id_colore_interno, 
    	sum(e.quantita) as quantita_totale
    FROM elenco_qr e
    GROUP BY e.lotto, e.id_prodotto, e.id_colore_esterno, e.id_colore_interno
) as e LEFT JOIN (
	SELECT 
    	s.lotto, 
    	COALESCE(s.id_articolo, s.id_accessorio) as id_prodotto, 
    	s.id_colore_esterno, 
    	s.id_colore_interno, 
    	sum(s.quantita) as quantita_scaricata
    FROM scarichi s
    GROUP BY s.lotto, COALESCE(s.id_articolo, s.id_accessorio), s.id_colore_esterno, s.id_colore_interno
) as s ON (
	e.lotto = s.lotto AND
    e.id_prodotto = s.id_prodotto AND
  	e.id_colore_esterno = s.id_colore_esterno AND
    e.id_colore_interno = s.id_colore_interno
)
${whereClause}
GROUP BY e.lotto
${havingClause}
ORDER BY ${sortBy} ${sortOrder}
LIMIT ? OFFSET ?
`

        const [lottoRows] = await db.query(lottoQuery, [ ...values, limitInt, offset ]);

        const scarichiElencoQRQuery = 
        `
SELECT 
    e.id,
	e.lotto,
	e.id_prodotto,
	e.id_colore_esterno,
	e.id_colore_interno,
    sum(e.quantita_totale) as quantita,
    COALESCE(sum(s.quantita_scaricata), 0) as quantita_scaricata
FROM (
    SELECT 
        e.id,
    	e.lotto, 
    	e.id_prodotto, 
    	e.id_colore_esterno, 
    	e.id_colore_interno, 
    	sum(e.quantita) as quantita_totale
    FROM elenco_qr e
    GROUP BY e.lotto, e.id_prodotto, e.id_colore_esterno, e.id_colore_interno
) as e LEFT JOIN (
	SELECT 
    	s.lotto, 
    	COALESCE(s.id_articolo, s.id_accessorio) as id_prodotto, 
    	s.id_colore_esterno, 
    	s.id_colore_interno, 
    	sum(s.quantita) as quantita_scaricata
    FROM scarichi s
    GROUP BY s.lotto, COALESCE(s.id_articolo, s.id_accessorio), s.id_colore_esterno, s.id_colore_interno
) as s ON (
	e.lotto = s.lotto AND
    e.id_prodotto = s.id_prodotto AND
  	e.id_colore_esterno = s.id_colore_esterno AND
    e.id_colore_interno = s.id_colore_interno
)
${whereClause}
GROUP BY e.lotto, e.id_prodotto, e.id_colore_esterno, e.id_colore_interno
ORDER BY e.id ASC
`

        const [scaricoElencoQRRows] = await db.query(scarichiElencoQRQuery, values);
        const lotti = {};
        scaricoElencoQRRows.forEach((scarico) => {
            if (!lotti[scarico.lotto]) {
                lotti[scarico.lotto] = [scarico];
            }
            else {
                lotti[scarico.lotto].push(scarico);
            }
        })
        lottoRows.forEach((lotto) => {
            if (lotti[lotto.lotto]) {
                lotto.scarichi = [...lotti[lotto.lotto]]
            }
            else {
                lotto.scarichi = [];
            }
        })

        return res.json({
            data: lottoRows,
            totalPages,
            currentPage: offset / limitInt + 1
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Internal server error");
    }
}

module.exports.postElencoQr = async (req, res) => {
    try {
        const {
            lotto,
            id_prodotto,
            id_colore_esterno,
            id_colore_interno,
            quantita
        } = req.body;

        const lottoACuiInserire = parseInt(lotto, 10);
        const idProdotto = id_prodotto?.trim();
        const idColoreEsterno = id_colore_esterno?.trim();
        const idColoreInterno = id_colore_interno?.trim();
        const quantitaDaScaricare = parseInt(quantita, 10);

        if (!lottoACuiInserire || isNaN(lottoACuiInserire)) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!idProdotto) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!idColoreEsterno) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!idColoreInterno) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!quantitaDaScaricare || isNaN(quantitaDaScaricare) || quantitaDaScaricare <= 0) {
            return res.status(400).json({ message: "Bad request" });
        }

        const [scaricoPresente] = await db.query("SELECT * FROM elenco_qr WHERE lotto = ? AND id_prodotto = ? AND id_colore_esterno = ? AND id_colore_interno = ?", [lottoACuiInserire, idProdotto, idColoreEsterno, idColoreInterno]);

        let scarico = null;
        if (scaricoPresente.length > 0) {
            scarico = await db.execute("UPDATE elenco_qr SET lotto = ?, id_prodotto = ?, id_colore_esterno = ?, id_colore_interno = ?, quantita = ? WHERE id = ?", [lottoACuiInserire, idProdotto, idColoreEsterno, idColoreInterno, quantitaDaScaricare + scaricoPresente[0].quantita, scaricoPresente[0].id]);
        }
        else {
            scarico = await db.execute("INSERT INTO elenco_qr (lotto, id_prodotto, id_colore_esterno, id_colore_interno, quantita) VALUES (?,?,?,?,?)", [lottoACuiInserire, idProdotto, idColoreEsterno, idColoreInterno, quantitaDaScaricare]);

        }

        if (!scarico) {
            return res.status(400).json({ message: "Bad request" });
        }

        return res.json(scarico);

    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.putElencoQr = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            lotto,
            id_prodotto,
            id_colore_esterno,
            id_colore_interno,
            quantita
        } = req.body;

        const lottoACuiInserire = parseInt(lotto, 10);
        const idProdotto = id_prodotto?.trim();
        const idColoreEsterno = id_colore_esterno?.trim();
        const idColoreInterno = id_colore_interno?.trim();
        const quantitaDaScaricare = parseInt(quantita, 10);

        if (!id) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!lottoACuiInserire || isNaN(lottoACuiInserire)) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!idProdotto) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!idColoreEsterno) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!idColoreInterno) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!quantitaDaScaricare || isNaN(quantitaDaScaricare) || quantitaDaScaricare <= 0) {
            return res.status(400).json({ message: "Bad request" });
        }

        const scarico = await db.execute("UPDATE elenco_qr SET lotto = ?, id_prodotto = ?, id_colore_esterno = ?, id_colore_interno = ?, quantita = ? WHERE id = ?", [lottoACuiInserire, idProdotto, idColoreEsterno, idColoreInterno, quantitaDaScaricare, id]);

        if (!scarico) {
            return res.status(404).json({ message: "Bad request" });
        }

        return res.json(scarico);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.deleteElencoQr = async (req, res) => {
    try {
        const { id } = req.params;

        const elencoQr = await db.execute("DELETE FROM elenco_qr WHERE id = ?", [id]);

        if (!elencoQr) {
            return res.status(404).json({ message: "Resource not found" })
        }

        return res.json(elencoQr);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.deleteLotto = async (req, res) => {
    try {
        const { lotto } = req.params;

        const lotti = await db.execute("DELETE FROM elenco_qr WHERE lotto = ?", [lotto]);

        return res.json(lotti);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}

