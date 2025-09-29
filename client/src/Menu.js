const menuItems = [
    {
        label: "Magazzino",
        path: "/profili",
        children: [
            {
                Label: "Carico",
                path: "/carichi",
                locked: true,
            },
            {
                Label: "Scarico",
                path: "/scarichi"
            },
            {
                Label: "Materiale ordinato",
                path: "/ordini"
            },
            {
                Label: "Materiale consegnato",
                path: "/consegne"
            },
            {
                Label: "QR Code",
                path: "/qr",
                locked: true,
            },
            {
                Label: "Elenco QR Code",
                path: "/qr/elenco",
                locked: true,
            },
            {
                Label: "Elenco profili",
                path: "/elenco",
                locked: true,
            },
            {
                Label: "Elenco accessori",
                path: "/accessori",
                locked: true,
            },
        ]
    }
]

export default menuItems;
