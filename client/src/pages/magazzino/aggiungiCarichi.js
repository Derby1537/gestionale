import React, { useEffect, useRef, useState } from "react";
import Table from "../../components/Table/Table";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useUser } from "../../contexts/UserContext";
import Papa from "papaparse";

const AggiungiCarichi = () => {
    const titles = ["Id prodotto", "Colore esterno", "Colore interno", "Quantità caricata (Pz)", "Comandi"];
    const [rows, setRows] = useState([]);
    const [data, setData] = useState(new Date().toISOString().split("T")[0]);
    const [info, setInfo] = useState("");
    const [dataError, setDataError] = useState("");
    const { isAdmin, checkAuth } = useUser();
    const importaCSVRef = useRef(null);

    const handleAddRow = () => {
        const newRow = {
            id_prodotto: "",
            errore_id_prodotto: "",
            id_colore_esterno: "",
            errore_id_colore_esterno: "",
            id_colore_interno: "",
            errore_id_colore_interno: "",
            quantita: "",
        }
        setRows([...rows, newRow]);
    }

    const handleDeleteRows = (indexes) => {
        const updatedRows = rows.filter((_, i) => !indexes.includes(i));
        setRows(updatedRows);
    }

    const handleInputChange = (index, field, value) => {
        if(field === "errore_data") {
            setDataError(value);
        }
        else {
            const updatedRows = [...rows];
            updatedRows[index][field] = value;
            setRows(updatedRows);
        }

    }

    const handleDataChange = (e) => {
        setData(e.target.value);
    }

    const handleInfoChange = (e) => {
        setInfo(e.target.value);
    }

    const handleKeyDown = (event) => {
        if(event.key === "Enter") {
            handleInsert();
        }
    }

    const handleInsert = async () => {
        let updatedRows = [...rows];

        const rowsToDelete = [];
        for(let i = 0; i < updatedRows.length; i++) {
            const row = updatedRows[i];
            try {
                const payload = {
                    ...row,
                    data,
                    info,
                }
                const response = await fetch("/api/magazzino/carichi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    credentials: "include",
                })
                if(!response.ok) {
                    const errorData = await response.json();
                    throw errorData;
                } 

                const responseData = await response.json();
                alert(responseData.message);
                rowsToDelete.push(i);
            }
            catch (error) {
                const keys = Object.keys(row);
                for(let index = 0; index < keys.length; index++) {
                    if(keys[index].startsWith("errore")) {
                        handleInputChange(i, keys[index], "");
                    }
                }
                handleInputChange(i, error.field, error.message)
            }
        }
        handleDeleteRows(rowsToDelete);

    }

    const tableData = rows.map((row, index) => ({
        id_prodotto: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_id_prodotto ? "d-none":""}`}>{row.errore_id_prodotto}</Tooltip>}>
                <input
                    name="id_prodotto"
                    className={`form-control text-center bg-transparent ${row.errore_id_prodotto ? "border border-danger" : "border-0"}`}
                    type="text"
                    placeholder="id articolo"
                    label={row.errore_id_prodotto}
                    value={row.id_prodotto}
                    onChange={(e) => handleInputChange(index, "id_prodotto", e.target.value)}
                />
            </OverlayTrigger>
        ),
        id_colore_esterno: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_id_colore_esterno ? "d-none":""}`}>{row.errore_id_colore_esterno}</Tooltip>}>
                <input
                    name="id_colore_esterno"
                    className={`form-control text-center bg-transparent ${row.errore_id_colore_esterno ? "border border-danger" : "border-0"}`}
                    type="text"
                    placeholder="id colore esterno"
                    label={row.errore_id_colore_esterno}
                    value={row.id_colore_esterno}
                    onChange={(e) => handleInputChange(index, "id_colore_esterno", e.target.value)}
                />
            </OverlayTrigger>
        ),
        id_colore_interno: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_id_colore_interno ? "d-none":""}`}>{row.errore_id_colore_interno}</Tooltip>}>
                <input
                    name="id_colore_interno"
                    className={`form-control text-center bg-transparent ${row.errore_id_colore_interno ? "border border-danger" : "border-0"}`}
                    type="text"
                    placeholder="id colore interno"
                    label={row.errore_id_colore_interno}
                    value={row.id_colore_interno}
                    onChange={(e) => handleInputChange(index, "id_colore_interno", e.target.value)}
                />
            </OverlayTrigger>
        ),
        quantita: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_quantita? "d-none":""}`}>{row.errore_quantita}</Tooltip>}>
                <input
                    name="quantita"
                    className={`form-control text-center bg-transparent ${row.errore_quantita ? "border border-danger" : "border-0"}`}
                    type="number"
                    step={1}
                    min={1}
                    placeholder="quantità"
                    label={row.errore_quantita}
                    value={row.quantita}
                    onChange={(e) => handleInputChange(index, "quantita", e.target.value)}
                />
            </OverlayTrigger>
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

    useEffect(() => {
        if (!importaCSVRef.current) return

        importaCSVRef.current.addEventListener('change', (event) => {
            if (event.target.files[0]) {
                importaCSV(event.target.files[0]);
            }
            else {
                alert("File invalido");
            }
        })
    }, [importaCSVRef])

    const importaCSV = (file) => {
        if ((file.name.endsWith(".csv") || file.name.endsWith(".CSV"))) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const newRows = [];
                    results.data.forEach((row) => {
                        if (!row.RIGA?.trim()) {
                            return;
                        }
                        newRows.push({
                            id_prodotto: row.ARTICOLO,
                            errore_id_prodotto: "",
                            id_colore_esterno: row.COLORE.split("-")[0]?.split(' ')[0],
                            errore_id_colore_esterno: "",
                            id_colore_interno: row.COLORE_INT?.split("-")[0]?.split(' ')[0] || "",
                            errore_id_colore_interno: "",
                            quantita: parseInt(row.N_BARRE_PZ),
                            errore_quantita: "",
                        })

                    }) 
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
            <div className="table-container" style={{height: 'calc(100% - 280px)'}}>
                <Table titles={titles} data={tableData}>
                </Table>

            </div>
            <div className="d-flex flex-column" style={{height: "280px"}}>
                <div className="d-flex flex-column flex-grow-1 justify-content-center border border-black rounded m-2 p-2">
                    <h3>Inserisci carichi</h3>
                    <label htmlFor="data">Data</label>
                    <input type="date" name="data" id="data" onChange={handleDataChange} value={data} className={`form-control ${dataError ? "border border-danger" : ""}`} label={dataError} />
                    <label htmlFor="info">Info aggiuntive</label>
                    <textarea type="date" name="info" id="info" onChange={handleInfoChange} value={info} className="form-control" style={{resize: "none"}} placeholder="info"></textarea>
                </div>
                <div className="d-flex justify-content-between flex-shrink-0" style={{height: "50px"}}>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleAddRow}>Aggiungi</Button>
                        <Button onClick={() => {importaCSVRef.current.click()}} className="mx-1">Importa .CSV</Button>
                        <input ref={importaCSVRef} className="d-none" type="file" accept=".csv" />
                    </div>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleInsert}>Inserisci</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AggiungiCarichi;
