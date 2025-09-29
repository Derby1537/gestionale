import React, { useEffect, useRef, useState } from "react";
import Table from "../../components/Table/Table";
import { Button } from "react-bootstrap";
import { QRCodeSVG } from "qrcode.react";
import { useUser } from "../../contexts/UserContext";
import Papa from "papaparse";

const ElencoQr = () => {
    const titles = ["Id prodotto", "Colore esterno", "Colore interno", "Quantità utilizzata (Pz)", "Info", "Comandi"];
    const [rows, setRows] = useState([]);
    const [titolo, setTitolo] = useState("");
    const [lotto, setLotto] = useState("");
    const [descrizione, setDescrizione] = useState("");
    const pageToPrintRef = useRef(null);
    const [pageToPrintContent, setPageToPrintContent] = useState(null);
    const { isAdmin, checkAuth } = useUser();
    const importaCSVRef = useRef(null);

    const handleAddRow = () => {
        const newRow = {
            id_prodotto: "",
            id_colore_esterno: "",
            id_colore_interno: "",
            quantita: "",
            info: "",
        }
        setRows([...rows, newRow]);
    }

    const handleDeleteRows = (indexes) => {
        const updatedRows = rows.filter((_, i) => !indexes.includes(i));
        setRows(updatedRows);
    }

    const handleInputChange = (index, field, value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        setRows(updatedRows);
    }

    const titoloChange = (e) => {
        setTitolo(e.target.value);
    }

    const lottoChange = (e) => {
        setLotto(e.target.value);
    }

    const descrizioneChange = (e) => {
        setDescrizione(e.target.value);
    }

    const handleKeyDown = (event) => {
        if(event.key === "Enter") {
            handleInsert();
        }
    }

    const handleInsert = async () => {
        if (rows.length === 0) return;
        if (lotto.length === 0) return;

        
        try {
            for (let i = 0; i < rows.length; i++) {
                const row = {...rows[i]};
                row.lotto = lotto;
                const response = await fetch("/api/magazzino/elenco_qr", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(row),
                    credentials: "include",
                })
                if (response.ok) continue;
                throw response;
            }

            let rowsToPrint = [...rows];
            for (let i = 0; i < rows.length; i++) {
                const response = await fetch("/api/magazzino/descrizione?" + new URLSearchParams(rows[i]));
                if(!response.ok) continue;
                const data = await response.json();

                rowsToPrint[i].descrizione = data.descrizione || "";
                rowsToPrint[i].descrizione_colore_esterno = data.descrizione_colore_esterno || "";
                rowsToPrint[i].descrizione_colore_interno = data.descrizione_colore_interno || "";
            }

            const page = (
                <div style={{fontFamily: "sans-serif"}}>
                    <img src="/logo.png" alt="planetWindows" height={50}/>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <h1>{titolo || ""}</h1>
                        <h1>Lotto: {lotto}</h1>
                    </div>
                    <p>{descrizione}</p>
                    <hr/><br/>
                    <table>
                        <thead>
                            <tr style={{borderBottom: "1px solid black"}}>
                                <th scope="col">#</th>
                                <th scope="col">Quantita</th>
                                <th scope="col">Articolo</th>
                                <th scope="col">Descrizione articolo</th>
                                <th scope="col">Colore esterno</th>
                                <th scope="col">Colore interno</th>
                                <th scope="col">Info</th>
                                <th scope="col">QR Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rowsToPrint.map((row, index) => (
                                <tr style={{ borderBottom: "1px solid black" }} key={index}>
                                    <td>{index+1})</td> 
                                    <td style={{textAlign: "center"}}>{row.quantita} Pz</td> 
                                    <td>{row.id_prodotto}</td> 
                                    <td>{row.descrizione}</td> 
                                    <td>{row.id_colore_esterno} - {row.descrizione_colore_esterno}</td> 
                                    <td>{row.id_colore_interno} - {row.descrizione_colore_interno}</td> 
                                    <td>{row.info}</td> 
                                    <td style={{ padding: "15px" }}>
                                        <QRCodeSVG 
                                            size={128}
                                            value={
                                                window.location.origin + "/magazzino/scarichi?" +
                                                new URLSearchParams({
                                                        addNew: "1",
                                                        id: row.id_prodotto,
                                                        ce: row.id_colore_esterno,
                                                        ci: row.id_colore_interno,
                                                        qnt: row.quantita,
                                                        lt: lotto,
                                                        inf: row.info
                                                    })}
                                        />
                                    </td> 
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )

            setPageToPrintContent(page);
            setTimeout(() => {
                const printWindow = window.open('', '_blank', 'height=400,width=800');
                printWindow.document.write(`
                <html>
                <head>
                    <title>QR Code lotto ${lotto}</title>
                    <style>
                        table, th, td {
                            border-collapse: collapse;
                        }
                        tr {
                            border-bottom: 1px solid black;
                            padding: 6px;
                            margin: 2px;
                        }
                    </style>
                </head>
                <body>
                    ${pageToPrintRef.current.innerHTML}
                </body>
                </html>
                `)
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 50)
            }, 50);
        }
        catch (e) {
            console.error(e);
            alert("Internal server error");
        }
    }

    const tableData = rows.map((row, index) => ({
        id_prodotto: (
            <input
                name="id_prodotto"
                className={`form-control text-center bg-transparent ${row.errore_id_prodotto ? "border border-danger" : "border-0"}`}
                type="text"
                placeholder="id articolo"
                value={row.id_prodotto}
                onChange={(e) => handleInputChange(index, "id_prodotto", e.target.value)}
            />
        ),
        id_colore_esterno: (
            <input
                name="id_colore_esterno"
                className={`form-control text-center bg-transparent ${row.errore_id_colore_esterno ? "border border-danger" : "border-0"}`}
                type="text"
                placeholder="id colore esterno"
                value={row.id_colore_esterno}
                onChange={(e) => handleInputChange(index, "id_colore_esterno", e.target.value)}
            />
        ),
        id_colore_interno: (
            <input
                name="id_colore_interno"
                className={`form-control text-center bg-transparent ${row.errore_id_colore_interno ? "border border-danger" : "border-0"}`}
                type="text"
                placeholder="id colore interno"
                value={row.id_colore_interno}
                onChange={(e) => handleInputChange(index, "id_colore_interno", e.target.value)}
            />
        ),
        quantita: (
            <input
                name="quantita"
                className={`form-control text-center bg-transparent ${row.errore_quantita ? "border border-danger" : "border-0"}`}
                type="number"
                step={1}
                min={1}
                placeholder="quantità"
                value={row.quantita}
                onChange={(e) => handleInputChange(index, "quantita", e.target.value)}
            />
        ),
        info: (
            <input
                name="info"
                className={`form-control text-center bg-transparent`}
                type="text"
                placeholder="info"
                value={row.info}
                onChange={(e) => handleInputChange(index, "info", e.target.value)}
            />
        ),
        comandi: (
            <Button
                variant="light"
                onClick={() => handleDeleteRows([index])}
                size="sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                </svg>
            </Button>
        ),
    }))

    useEffect(() => {
        checkAuth();
        //handleAddRow();
    }, [])

    const importaCSV = (file) => {
        if ((file.name.endsWith(".csv") || file.name.endsWith(".CSV"))) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const newRows = [];
                    let lotto = "";
                    results.data.forEach((row) => {
                        if (!row.RIGA?.trim()) {
                            return;
                        }
                        if (!lotto) {
                            lotto = row.ORD;
                        }
                        newRows.push({
                            id_prodotto: row.ARTICOLO,
                            id_colore_esterno: row.COLORE.split("-")[0]?.split(' ')[0],
                            id_colore_interno: row.COLORE_INT?.split("-")[0]?.split(' ')[0] || "",
                            quantita: parseInt(row.N_BARRE_PZ),
                            info: "",
                        })

                    }) 
                    setLotto(lotto)
                    setRows([...rows, ...newRows]);
                },
                error: function (err) {
                    console.error(err);
                },
            });
        } else {
            alert("Seleziona un file CSV valido.");
        }
    }

    if (!isAdmin()) {
        return (<>Non sei autenticato</>);
    }

    return (
        <div className="under-navbar-pagine" tabIndex={0} onKeyDown={handleKeyDown}>
            <div className="d-none" ref={pageToPrintRef}>
                {pageToPrintContent}
            </div>
            <div className="table-container" style={{height: 'calc(100% - 280px)'}}>
                <Table titles={titles} data={tableData}>
                </Table>

            </div>
            <div className="d-flex flex-column" style={{height: "280px"}}>
                <div className="d-flex flex-column flex-grow-1 justify-content-center border border-black rounded m-2 p-2">
                    <div className="w-100 d-flex p-1">
                        <div className="w-50 p-1">
                            <label htmlFor="data">Titolo elenco</label>
                            <input type="text" name="titolo" id="titolo" onChange={titoloChange} className="form-control" value={titolo} placeholder="titolo"/>
                        </div>
                        <div className="w-50 p-1">
                            <label htmlFor="lotto">lotto</label>
                            <input type="text" name="lotto" id="lotto" onChange={lottoChange} value={lotto} className="form-control" placeholder="lotto"/>
                        </div>
                    </div>
                    <div className="w-100 p-1">
                        <label htmlFor="descrizione">Descrizione elenco</label>
                        <textarea name="descrizione" id="descrizione" onChange={descrizioneChange} value={descrizione} className="form-control" style={{resize: "none"}} placeholder="descrizione"></textarea>
                    </div>
                </div>
                <div className="d-flex justify-content-between flex-shrink-0" style={{height: "50px"}}>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleAddRow}>Aggiungi</Button>
                        <Button className="mx-1" onClick={() => { importaCSVRef.current?.click() }}>Importa .CSV</Button>
                        <input 
                            className="d-none" 
                            type="file" 
                            accept=".csv"
                            ref={importaCSVRef}
                            onChange={(event) => {
                                const file = event.target.files[0];
                                if (!file) return;
                                importaCSV(file);
                            }}
                        />
                    </div>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleInsert}>Genera elenco QR</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ElencoQr;
