const { db } = require("../../server");

module.exports.getVetri = async (req, res) => {
    try {
        const {
            q,
            lotto,
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
            filters.push("lotto LIKE ?");
            values.push(`%${q}%`);
        }
        if (lotto) {
            filters.push("lotto LIKE ?");
            values.push(`%${lotto}%`);
        }
    if (status) {
        switch  (status) {
            case "partial":
                havingFilters.push("quantita_totale > quantita_consegnata");
                break;
            case "complete":
                havingFilters.push("quantita_totale <= quantita_consegnata");
                break;
        }
    }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
        const havingClause = havingFilters.length > 0 ? `HAVING ${havingFilters.join(" AND ")}` : "";

        const countQuery = `
SELECT COUNT(*) AS count FROM (
SELECT 
    riferimento,
    lotto,
    SUM(numero_vetri) AS quantita_totale,
    SUM(CASE WHEN consegnato = 1 THEN numero_vetri ELSE 0 END) AS quantita_consegnata
FROM vetri_ordinati
${whereClause}
GROUP BY lotto
${havingClause}
) as v
`
        const [countRows] = await db.query(countQuery, values)

        const totalItems = countRows[0].count;
        const totalPages = Math.ceil(totalItems / limitInt)

        let sortBy = "lotto";
        let sortOrder = "DESC";
        if (["lotto", "riferimento", "quantita_totale", "quantita_consegnata"].includes(sort_by)) {
            sortBy = sort_by;
        }
        if (sort_order && sort_order.toLowerCase() === "asc") {
            sortOrder = "ASC";
        }

        const lottoQuery = `
SELECT 
    riferimento,
    lotto,
    SUM(numero_vetri) AS quantita_totale,
    SUM(CASE WHEN consegnato = 1 THEN numero_vetri ELSE 0 END) AS quantita_consegnata
FROM vetri_ordinati
${whereClause}
GROUP BY lotto
${havingClause}
ORDER BY ${sortBy} ${sortOrder}
LIMIT ? OFFSET ?
`
        const [lottoRows] = await db.query(lottoQuery, [ ...values, limitInt, offset ]);

        const vetriQuery = `
SELECT *
FROM vetri_ordinati
${whereClause}
`
        const [vetriRows] = await db.query(vetriQuery, values);
        const lotti = {}
        vetriRows.forEach((vetri) => {
            if (!lotti[vetri.lotto]) {
                lotti[vetri.lotto] = [vetri];
            }
            else {
                lotti[vetri.lotto].push(vetri);
            }
        })
        lottoRows.forEach((lotto) => {
            lotto.vetri = [...lotti[lotto.lotto]];
        })

        return res.json({
            data: lottoRows,
            totalPages,
            currentPage: offset / limitInt + 1
        })

    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.postVetro = async (req, res) => {
    try {
        const {
            riferimento,
            lotto,
            numero_vetri,
            data_consegna,
            consegnato
        } = req.body;

        if (!riferimento) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!lotto) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!data_consegna) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!numero_vetri || isNaN(numero_vetri)) {
            return res.status(400).json({ message: "Bad request" });
        }

        const vetro = await db.execute("INSERT INTO vetri_ordinati (riferimento, lotto, data_consegna_ numero_vetri, consegnato) VALUES (?,?,?,?,?)",
        [riferimento, data_consegna, numero_vetri, consegnato == true ? 1 : 0]);

        if (!vetro[0].affectedRows === 0) {
            return res.status(404).json({ message: "Resource not found" });
        }

        res.json(vetro);
    }
    catch (e) {
        if (err.code === "ER_NO_REFERENCED_ROW_2" || err.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({ message: "Bad request" });
        }
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.putVetro = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            riferimento,
            lotto,
            numero_vetri,
            data_consegna,
            consegnato
        } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!riferimento) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!lotto) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!data_consegna) {
            return res.status(400).json({ message: "Bad request" });
        }
        if (!numero_vetri || isNaN(numero_vetri)) {
            return res.status(400).json({ message: "Bad request" });
        }

        const vetro = await db.execute("UPDATE vetri_ordinati SET riferimento = ?, lotto = ?, data_consegna = ?, numero_vetri = ?, consegnato = ? WHERE id = ?",
        [riferimento, lotto, data_consegna, numero_vetri, consegnato == true ? 1 : 0, id]);

        if (!vetro[0].affectedRows === 0) {
            return res.status(404).json({ message: "Resource not found" });
        }

        res.json(vetro);
    }
    catch (e) {
        if (e.code === "ER_NO_REFERENCED_ROW_2" || e.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({ message: "Bad request" });
        }
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports.deleteVetro = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Bad request" });
        }

        const vetro = await db.execute("DELETE FROM vetri_ordinati WHERE id = ?", [id]);

        if (!vetro) {
            return res.status(404).json({ message: "Resource not found" });
        }

        return res.json(vetro);
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}
