import React, { useEffect, useRef, useState } from "react";
import Table from "../../components/Table/Table";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useUser } from "../../contexts/UserContext";
import Papa from "papaparse";

const AggiungiVetri = () => {
    const titles = [
        "Riferimento",
        "Quantità", 
        "Comandi"
    ];
    const [rows, setRows] = useState([]);
    const { isAdmin, checkAuth } = useUser();
    const [data, setData] = useState(new Date().toISOString().split("T")[0]);
    const [lotto, setLotto] = useState("");
    const [consegnato, setConsegnato] = useState(false);
    const [dataError, setDataError] = useState("");
    const [lottoError, setLottoError] = useState("");
    const importaCSVRef = useRef(null);

    const handleAddRow = () => {
        const newRow = {
            riferimento: "",
            errore_riferimento: "",
            numero_vetri: 1,
            errore_numero_vetri: "",
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

    const handleDataChange = (e) => {
        setData(e.target.value);
    }

    const onLottoChange = (e) => {
        const { value } = e.target;
        setLotto(value);
    }

    const onConsegnatoChange = (e) => {
        const { checked } = e.target;
        setConsegnato(checked);
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
                    lotto: lotto,
                    data_consegna: data,
                    consegnato: consegnato,
                    ...row
                }
                const response = await fetch("/api/ordini/vetri/aggiungi", {
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
                setLottoError("");
                setDataError("");
                if (error.field === "errore_lotto") {
                    setLottoError(error.message);
                }
                if (error.field === "errore_data") {
                    setDataError(error.message);
                }
            }
        }
        handleDeleteRows(rowsToDelete);
    }

    const importaCSV = (file) => {
        if ((file.name.endsWith(".csv") || file.name.endsWith(".CSV"))) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const newRows = [];
                    let lotto = "";
                    let data = null;
                    const vetri = {};
                    results.data.forEach((row) => {
                        if (!lotto) {
                            lotto = row.lotto;
                        }
                        if (!data) {
                            data = row.DATA;
                        }
                        if (!vetri[row.ORD]) {
                            vetri[row.ORD] = {
                                riferimento: row.ORD,
                                numero_vetri: parseInt(row.N_BARRE_PZ, 10)
                            }
                        }
                        else {
                            vetri[row.ORD].numero_vetri += parseInt(row.N_BARRE_PZ, 10);
                        }
                    }) 
                    Object.keys(vetri).forEach((vetro) => {
                        newRows.push(vetri[vetro]);
                    })
                    setLotto(lotto)
                    setRows((prev) => ([
                        ...prev,
                        ...newRows
                    ]));
                },
                error: function (err) {
                    console.error(err);
                },
            });
        } else {
            alert("Seleziona un file CSV valido.");
        }
    }

    const tableData = rows.map((row, index) => ({
        riferimento: (
            <OverlayTrigger 
                placement="top" 
                overlay={<Tooltip className={`${!row.riferimento ? "d-none":""}`}>{row.errore_riferimento}</Tooltip>}
            >
                <input
                    name="riferimento"
                    placeholder="riferimento"
                    className={`form-control text-center bg-transparent ${row.errore_riferimento ? "border border-danger" : "border-0"}`}
                    type="text"
                    label={row.errore_riferimento}
                    value={row.riferimento}
                    onChange={(e) => handleInputChange(index, "riferimento", e.target.value)}
                />
            </OverlayTrigger>
        ),
        numero_vetri: (
            <OverlayTrigger 
                placement="top" 
                overlay={<Tooltip className={`${!row.errore_numero_vetri ? "d-none":""}`}>{row.errore_numero_vetri}</Tooltip>}
            >
                <input
                    name="numero_vetri"
                    className={`form-control text-center bg-transparent ${row.errore_numero_vetri ? "border border-danger" : "border-0"}`}
                    type="number"
                    step={1}
                    min={1}
                    label={row.errore_numero_vetri}
                    value={row.numero_vetri}
                    onChange={(e) => handleInputChange(index, "numero_vetri", e.target.value)}
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

    if (!isAdmin()) {
        return (<>Non sei autenticato</>);
    }

    return (

        <div className="under-navbar-pagine" tabIndex={0} onKeyDown={handleKeyDown}>
            <div className="table-container" style={{height: "calc(100% - 220px)"}}>
                <Table titles={titles} data={tableData}>
                </Table>

            </div>
            <div className="d-flex flex-column" style={{height: "200px"}}>
                <div className="d-flex flex-column flex-grow-1 justify-content-center border border-black rounded m-2 p-2">
                    <h3>Inserisci vetri ordinati</h3>
                    <div className="d-flex w-100 gap-2">
                        <div className="w-50">
                            <label htmlFor="lotto">Lotto</label>
                            <input 
                                type="text" 
                                name="lotto" 
                                placeholder="lotto"
                                id="lotto" 
                                onChange={onLottoChange} 
                                value={lotto} 
                                className={ `form-control ${lottoError ? "border border-danger" : ""}` }
                            />
                        </div>

                        <div className="d-flex flex-column w-50">
                            <label htmlFor="data">Data</label>
                            <input type="date" name="data" id="data" onChange={handleDataChange} value={data} className={`form-control ${dataError ? "border border-danger" : ""}`} label={dataError} />
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 p-2">
                        <input
                            type="checkbox"
                            id="consegnato"
                            name="consegnato"
                            checked={consegnato}
                            onChange={onConsegnatoChange}
                        />
                        <label htmlFor="consegnato">Consegnato</label>
                    </div>

                </div>
                <div className="d-flex justify-content-between flex-shrink-0" >
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleAddRow}>Aggiungi</Button>
                        <Button className="mx-1" onClick={() => { importaCSVRef.current?.click() }}>Importa .CSV</Button>
                        <input 
                            className="d-none" 
                            type="file" 
                            accept=".csv"
                            multiple
                            ref={importaCSVRef}
                            onChange={(event) => {
                                for (let i = 0; i < event.target.files.length; i++) {
                                    const file = event.target.files[i];
                                    importaCSV(file);
                                }
                            }}
                        />
                    </div>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleInsert}>Inserisci</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AggiungiVetri;
