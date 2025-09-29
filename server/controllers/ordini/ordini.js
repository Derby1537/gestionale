const { db, formatDate } = require("../../server");

module.exports.getPezzi = async (req, res) => {
    try {
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

        const filters = [];
        const values = [];

        if (numero_ordine?.trim()) {
            filters.push("numero_ordine LIKE ?");
            values.push(`%${numero_ordine}%`);
        }
        if (numero_cliente?.trim()) {
            filters.push("numero_cliente LIKE ?");
            values.push(`%${numero_cliente}%`);
        }
        if (numero_cliente?.trim()) {
            filters.push("data = ?");
            values.push(formatDate(new Date(data)));
        }
        if (ok_prod && ok_prod !== "null") {
            filters.push("ok_prod = ?");
            values.push(ok_prod);
        }
        if (id_colore_esterno?.trim()) {
            filters.push("lo.id_colore_esterno LIKE ?");
            values.push(`%${id_colore_esterno}%`);
        }
        if (id_colore_interno?.trim()) {
            filters.push("lo.id_colore_interno LIKE ?");
            values.push(`%${id_colore_esterno}%`);
        }
        if (profilo?.trim()) {
            filters.push("ce.fornitore LIKE ?");
            values.push(`%${profilo}%`)
        }
        if (consegna_vetri) {
            filters.push("v.data_consegna = ?");
            values.push(formatDate(new Date(consegna_vetri)));
        }
        if (consegna_profili) {
            filters.push("o.data_consegna = ?");
            values.push(formatDate(new Date(consegna_profili)));
        }
        if (produzione && produzione === "0") {
            filters.push(`(
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
            )`);
        }
        if (produzione && produzione === "1") {
            filters.push(`(
                (numero_infissi > 0 AND lotto_infissi IS NOT NULL)
                OR (numero_infissi = 0)
            )`);
            filters.push(`(
                (numero_cassonetti > 0 AND lotto_cassonetti IS NOT NULL)
                OR (numero_cassonetti = 0)
            )`)
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

        const queryString = `
SELECT 
    SUM(numero_infissi) AS infissi,
    SUM(numero_cassonetti) AS cassonetti
FROM
(SELECT 
lo.numero_ordine,
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
${whereClause}
GROUP BY numero_ordine ORDER BY data ASC
) AS s
`

        const [rows] = await db.query(queryString, values);

        return res.json(rows[0])
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Internal server error" });
    }
}

