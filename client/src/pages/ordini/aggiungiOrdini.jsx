import { useEffect, useState } from "react";
import Table from "../../components/Table/Table";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useUser } from "../../contexts/UserContext";

const AggiungiListaOrdini = () => {
    const titles = [
        "Numero ordine", 
        "Data consegna", 
        "Numero cliente", 
        "Ok prod",
        "Colore esterno", 
        "Colore interno", 
        "Infissi", 
        "Cassonetti", 
        "Comandi"
    ];
    const [rows, setRows] = useState([]);
    const { isAdmin, checkAuth } = useUser();

    const handleAddRow = () => {
        const newRow = {
            numero_ordine: "",
            errore_numero_ordine: "",
            data_consegna: new Date(),
            errore_data_consegna: "",
            numero_cliente: "",
            id_colore_esterno: "",
            errore_id_colore_esterno: "",
            id_colore_interno: "",
            errore_id_colore_interno: "",
            infissi: 1,
            errore_infissi: "",
            cassonetti: 1,
            errore_cassonetti: "",
        }
        setRows([...rows, newRow]);
    }

    const handleDeleteRows = (indexes) => {
        const updatedRows = rows.filter((_, i) => !indexes.includes(i));
        setRows(updatedRows);
    }

    const handleInputChange = (index, field, value) => {
        if (field === "ok_prod") {
            const updatedRows = [...rows];
            updatedRows[index][field] = !updatedRows[index][field];
            setRows(updatedRows);
        }
        else {
            const updatedRows = [...rows];
            updatedRows[index][field] = value;
            setRows(updatedRows);
        }
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
                    ...row
                }
                const response = await fetch("/api/ordini/", {
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
        numero_ordine: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_numero_ordine ? "d-none":""}`}>{row.errore_numero_ordine}</Tooltip>}>
                <input
                    name="numero_ordine"
                    className={`form-control text-center bg-transparent ${row.errore_numero_ordine ? "border border-danger" : "border-0"}`}
                    type="text"
                    placeholder="numero ordine"
                    label={row.errore_numero_ordine}
                    value={row.numero_ordine}
                    onChange={(e) => handleInputChange(index, "numero_ordine", e.target.value)}
                />
            </OverlayTrigger>
        ),
        data_consegna: (
            <OverlayTrigger placement="top" overlay={<Tooltip className={`${!row.errore_data_consegna ? "d-none":""}`}>{row.errore_data_consegna}</Tooltip>}>
                <input
                    name="data_consegna"
                    className={`form-control text-center bg-transparent ${row.errore_data_consegna ? "border border-danger" : "border-0"}`}
                    type="date"
                    label={row.errore_data_consegna}
                    value={row.data_consegna}
                    onChange={(e) => handleInputChange(index, "data_consegna", e.target.value)}
                />
            </OverlayTrigger>
        ),
        numero_cliente: (
            <OverlayTrigger 
                placement="top" 
                overlay={<Tooltip className={`${!row.errore_numero_cliente ? "d-none":""}`}>{row.errore_numero_cliente}</Tooltip>}
            >
                <input
                    name="numero_cliente"
                    className={`form-control text-center bg-transparent ${row.errore_numero_cliente ? "border border-danger" : "border-0"}`}
                    type="text"
                    placeholder="numero cliente"
                    label={row.errore_numero_cliente}
                    value={row.numero_cliente}
                    onChange={(e) => handleInputChange(index, "numero_cliente", e.target.value)}
                />
            </OverlayTrigger>
        ),
        ok_prod: (
                <input 
                    type="checkbox" 
                    name="ok_prod" 
                    id="ok_prod" 
                    onChange={(e) => handleInputChange(index, "ok_prod", e.target.value)} 
                    checked={row.ok_prod}
                />
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
        numero_infissi: (
            <OverlayTrigger 
                placement="top" 
                overlay={<Tooltip className={`${!row.errore_numero_infissi? "d-none":""}`}>{row.errore_numero_infissi}</Tooltip>}
            >
                <input
                    name="numero_infissi"
                    className={`form-control text-center bg-transparent ${row.errore_numero_infissi ? "border border-danger" : "border-0"}`}
                    type="number"
                    step={1}
                    min={0}
                    placeholder="numero infissi"
                    label={row.errore_numero_infissi}
                    value={row.numero_infissi}
                    onChange={(e) => handleInputChange(index, "numero_infissi", e.target.value)}
                />
            </OverlayTrigger>
        ),
        numero_cassonetti: (
            <OverlayTrigger 
                placement="top" 
                overlay={<Tooltip className={`${!row.errore_numero_cassonetti? "d-none":""}`}>{row.errore_numero_cassonetti}</Tooltip>}
            >
                <input
                    name="numero_cassonetti"
                    className={`form-control text-center bg-transparent ${row.errore_numero_cassonetti ? "border border-danger" : "border-0"}`}
                    type="number"
                    step={1}
                    min={0}
                    placeholder="numero cassonetti"
                    label={row.errore_numero_cassonetti}
                    value={row.numero_cassonetti}
                    onChange={(e) => handleInputChange(index, "numero_cassonetti", e.target.value)}
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
            <div className="table-container flex-grow-1" >
                <Table titles={titles} data={tableData}>
                </Table>

            </div>
            <div className="d-flex flex-column" style={{height: "100px"}}>
                <div className="d-flex justify-content-between flex-shrink-0" >
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleAddRow}>Aggiungi</Button>
                    </div>
                    <div className="d-flex justify-content-center align-items-center">
                        <Button className="mx-1" onClick={handleInsert}>Inserisci</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AggiungiListaOrdini;
