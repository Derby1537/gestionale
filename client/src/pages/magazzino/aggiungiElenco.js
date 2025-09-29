import React, { useEffect, useState } from "react";
import Table from "../../components/Table/Table";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useUser } from "../../contexts/UserContext";

const AggiungiElenco = () => {
    const titles = ["Id prodotto", "Descrizione", "Lunghezza barra (metri)", "Prezzo in massa", "Prezzo pellicolato", "Comandi"];
    const [rows, setRows] = useState([]);
    const [data, setData] = useState(new Date().toISOString().split("T")[0]);
    const [fornitore, setFornitore] = useState("");
    const { isAdmin, checkAuth } = useUser();

    const handleAddRow = () => {
        const newRow = {
            id: "",
            errore_id: "",
            descrizione: "",
            lunghezza_barra: "",
            errore_lunghezza_barra: "",
            prezzo: "",
            errore_prezzo: "",
            prezzo_pellicolato: "",
            errore_prezzo_pellicolato: "",
        }
        setRows([...rows, newRow]);
    }

    const handleDeleteRow = (index) => {
        const updatedRows = rows.filter((_, i) => i !== index);
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

    const handleFornitoreChange = (e) => {
        setFornitore(e.target.value);
    }

    const handleKeyDown = (event) => {
        if(event.key === "Enter") {
            handleInsert();
        }
    }

    const handleInsert = async () => {
        let updatedRows = [...rows];

        for(let i = 0; i < updatedRows.length; i++) {
            const row = updatedRows[i];
            try {
                const payload = {
                    ...row,
                    fornitore,
                }
                const response = await fetch("/api/magazzino/elenco", {
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
                handleDeleteRow(i);
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

    }

    const tableData = rows.map((row, index) => ({
        id_prodotto: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_id ? "d-none":""}`}>{row.errore_id}</Tooltip>}>
                <input
                    name="id"
                    className={`form-control text-center bg-transparent ${row.errore_id ? "border border-danger" : "border-0"}`}
                    type="text"
                    placeholder="id articolo"
                    label={row.errore_id}
                    value={row.id}
                    onChange={(e) => handleInputChange(index, "id", e.target.value)}
                />
            </OverlayTrigger>
        ),
        descrizione: (
            <input
                name="descrizione"
                className="form-control text-center bg-transparent border-0"
                type="text"
                placeholder="descrizione"
                value={row.descrizione}
                onChange={(e) => handleInputChange(index, "descrizione", e.target.value)}
            />
        ),
        lunghezza_barra: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_lunghezza_barra? "d-none":""}`}>{row.errore_lunghezza_barra}</Tooltip>}>
                <input
                    name="lunghezza_barra"
                    className={`form-control text-center bg-transparent ${row.errore_lunghezza_barra ? "border border-danger" : "border-0"}`}
                    type="number"
                    step={0.5}
                    min={0.5}
                    placeholder="lunghezza_barra"
                    label={row.errore_lunghezza_barra}
                    value={row.lunghezza_barra}
                    onChange={(e) => handleInputChange(index, "lunghezza_barra", e.target.value)}
                />
            </OverlayTrigger>
        ),
        prezzo: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_prezzo? "d-none":""}`}>{row.errore_prezzo}</Tooltip>}>
                <input
                    name="prezzo"
                    className={`form-control text-center bg-transparent ${row.errore_prezzo ? "border border-danger" : "border-0"}`}
                    type="number"
                    step={0.01}
                    min={0.01}
                    placeholder="prezzo in massa"
                    label={row.errore_prezzo}
                    value={row.prezzo}
                    onChange={(e) => handleInputChange(index, "prezzo", e.target.value)}
                />
            </OverlayTrigger>
        ),
        prezzo_pellicolato: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_prezzo_pellicolato? "d-none":""}`}>{row.errore_prezzo_pellicolato}</Tooltip>}>
                <input
                    name="prezzo_pellicolato"
                    className={`form-control text-center bg-transparent ${row.errore_prezzo_pellicolato ? "border border-danger" : "border-0"}`}
                    type="number"
                    step={0.01}
                    min={0.01}
                    placeholder="prezzo pellicolato"
                    label={row.errore_prezzo_pellicolato}
                    value={row.prezzo_pellicolato}
                    onChange={(e) => handleInputChange(index, "prezzo_pellicolato", e.target.value)}
                />
            </OverlayTrigger>
        ),
        comandi: (
            <Button
                variant="light"
                onClick={() => handleDeleteRow(index)}
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
            <div className="table-container" style={{height: 'calc(100% - 280px)'}}>
                <Table titles={titles} data={tableData}>
                </Table>

            </div>
            <div className="d-flex flex-column" style={{height: "280px"}}>
                <div className="d-flex flex-column flex-grow-1 justify-content-center border border-black rounded m-2 p-2">
                    <h3>Inserisci profili</h3>
                    <label htmlFor="fornitore">Fornitore</label>
                    <textarea type="text" name="fornitore" id="fornitore" onChange={handleFornitoreChange} value={fornitore} className="form-control" style={{resize: "none"}} placeholder="fornitore"></textarea>
                </div>
                <div className="d-flex justify-content-between flex-shrink-0" style={{height: "50px"}}>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleAddRow}>Aggiungi</Button>
                        <Button className="mx-1">Importa .CSV</Button>
                    </div>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleInsert}>Inserisci</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AggiungiElenco;
