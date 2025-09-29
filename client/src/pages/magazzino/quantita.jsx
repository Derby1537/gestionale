import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Table from "../../components/Table/Table";
import BottoneAggiungi from "../../components/BottoneAggiungi";
import Pagination from "../../components/Table/Pagination";
import BottoneFiltra from "../../components/BottoneFiltra";
import BottoneModifica from "../../components/BottoneModifica";
import BottoneElimina from "../../components/BottoneElimina";
import { useUser } from "../../contexts/UserContext";

const QuantitaProfili = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const { isAdmin, checkAuth } = useUser();

    const filterButtonRef = useRef(null);
    const addButtonRef = useRef(null);
    
    const [commandsDisabled, setCommandsDisabled] = useState(false);
    const [scarichi, setScarichi] = useState([]);
    const [_loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(parseInt(queryParams.get('page')) || 1);
    const itemsPerPage = parseInt(queryParams.get('limit')) || 25;
    const [filters, setFilters] = useState({
        q: queryParams.get("q") || "",
        id_colore_esterno: queryParams.get("id_colore_esterno") || "",
        id_colore_interno: queryParams.get("id_colore_interno") || "",
        fornitore: queryParams.get("fornitore") ||"",
    })
    const [newScarico, setNewScarico] = useState({
        id_prodotto: "",
        errore_id_prodotto: "",
        id_colore_esterno: "",
        errore_id_colore_esterno: "",
        id_colore_interno: "",
        errore_id_colore_interno: "",
        quantita_minima: 1,
        errore_quantita_minima: ""
    })
    const titoli = [
        "Fornitore" + (queryParams.get("fornitore") ? '*':''), 
        "Articolo" + (queryParams.get("q") ? '*':''), 
        "Colore esterno" + (queryParams.get("id_colore_esterno") ? '*':''), 
        "Colore interno" + (queryParams.get("id_colore_interno") ? '*':''), 
        "Qta minima", 
        "Qta in magazzino", 
        "Qta in arrivo", 
        "Comandi"
    ]

    const handleKeyDown = (event) => {
        if(!commandsDisabled) {
            if(event.keyCode === 70) {
                event.preventDefault();
                if(filterButtonRef.current) {
                    filterButtonRef.current.click();
                }
            }
            if(event.keyCode === 65) {
                event.preventDefault();
                if(addButtonRef.current) {
                    addButtonRef.current.click();
                }
            }
        }
    }

    const disableCommands = () => {
        setCommandsDisabled(true);
    }
    const enableCommands = () => {
        setCommandsDisabled(false);
    }

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }))
    }

    const handleAddChange = (e) => {
        const { name, value } = e.target;
        setNewScarico((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }))
    }

    const handleApplyFilters = () => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set("page", 1);
        setCurrentPage(1);
        Object.entries(filters).forEach(([key, value]) => {
            if(value) {
                searchParams.set(key, value);
            }
            else {
                searchParams.delete(key);
            }
        });
        navigate({
            pathname: location.pathname,
            search: searchParams.toString(), 
        });
    }

    const handleApplyInsert = async () => {
        try {
            const response = await fetch("/api/magazzino/quantita", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newScarico),
            })
            if(!response.ok) {
                const errorData = await response.json();
                throw errorData;
            } 

            const data = await response.json();

            setFilters({
                q: "",
                id_colore_esterno: "",
                id_colore_interno: "",
                data: "",
                info: "",
            })
            handleApplyFilters();

            setNewScarico({
                id_prodotto: "",
                errore_id_prodotto: "",
                id_colore_esterno: "",
                errore_id_colore_esterno: "",
                id_colore_interno: "",
                quantita_minima: 1,
                errore_quantita_minima: "",
            })
            alert(data.message);
            fetchScarichi();
            return true;
        }
        catch (error) {
            setNewScarico((prevFilters) => ({
                ...prevFilters,
                errore_id_prodotto: "",
                errore_id_colore_esterno: "",
                errore_id_colore_interno: "",
                errore_quantita_minima: "",
                [error.field]: error.message,
            }))
            return false;
        }
    }
    const addForm = () => {
        return (
            <div>
                <label htmlFor="id_prodotto">Id prodotto</label><br/>
                <input 
                    type="text" 
                    placeholder="id prodotto" 
                    name="id_prodotto"
                    id="id_prodotto"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.id_prodotto}
                />
                <div className="text-danger" id="errore_id_prodotto">{newScarico.errore_id_prodotto}</div>
                <br/>

                <label htmlFor="id_colore_esterno">Id colore esterno</label><br/>
                <input 
                    type="text" 
                    placeholder="id colore esterno" 
                    name="id_colore_esterno"
                    id="id_colore_esterno"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.id_colore_esterno}
                />
                <div className="text-danger"id="errore_id_colore_esterno">{newScarico.errore_id_colore_esterno}</div>
                <br/>

                <label htmlFor="id_colore_interno">Id colore interno (lasciare vuoto per inserire un accessorio)</label><br/>
                <input 
                    type="text" 
                    placeholder="id colore interno" 
                    name="id_colore_interno"
                    id="id_colore_interno"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.id_colore_interno}
                />
                <div className="text-danger"id="errore_id_colore_interno">{newScarico.errore_id_colore_interno}</div>
                <br/>

                <label htmlFor="quantita_minima">Quantità minima (Pz)</label><br/>
                <input 
                    type="number" 
                    step="1"
                    min="1"
                    placeholder="quantita minima" 
                    name="quantita_minima"
                    id="quantita_minima"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.quantita_minima}
                />
                <div className="text-danger"id="errore_quantita_minima">{newScarico.errore_quantita_minima}</div>
                <br/>
            </div>
        );
    }

    const filterForm = () => {
        return (
            <div>
                <label htmlFor="fornitore">Fornitore</label><br/>
                <input 
                    type="text" 
                    placeholder="fornitore" 
                    name="fornitore"
                    id="fornitore"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.fornitore}
                />
                <br/>

                <label htmlFor="q">Id articolo</label><br/>
                <input 
                    type="text" 
                    placeholder="id articolo" 
                    name="q"
                    id="q"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.q}
                />
                <br/>

                <label htmlFor="id_colore_esterno">Id colore esterno</label><br/>
                <input 
                    type="text" 
                    placeholder="id colore esterno" 
                    name="id_colore_esterno"
                    id="id_colore_esterno"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.id_colore_esterno}
                />
                <br/>

                <label htmlFor="id_colore_interno">Id colore interno</label><br/>
                <input 
                    type="text" 
                    placeholder="id colore interno" 
                    name="id_colore_interno"
                    id="id_colore_interno"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.id_colore_interno}
                />
                <br/>
            </div>
        );
    }

    const fetchScarichi = async () => {
        setLoading(true);
        setError(null);

        try {
            const searchQuery = queryParams.get("q") || "";
            const response = await fetch(`/api/magazzino/quantita?id_prodotto=${searchQuery}&limit=${itemsPerPage}&page=${currentPage}&${new URLSearchParams(filters).toString()}`);
            if(!response.ok) throw response;

            const dati = await response.json();
            const data = dati.data;
            const valoriDaTenere = [
                "fornitore",
                "id_prodotto", 
                "id_colore_esterno", 
                "id_colore_interno", 
                "quantita_minima", 
                "quantita_in_magazzino", 
                "quantita_in_arrivo", 
            ];
            const scarichi = data.map(obj => {
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                        if (key === "quantita_minima" ||
                            key === "quantita_in_magazzino" || 
                            key === "quantita_in_arrivo") {
                            newObj[key] += ' Pz'
                        }
                        else if (key === "id_prodotto") {
                            newObj[key] += '*' + obj["id_colore_esterno"] + (obj["id_colore_interno"] || '') + "*";
                        }
                        else if(key === "id_colore_esterno") {
                            newObj[key] += ' - ' + obj["descrizione_colore_esterno"];
                        }
                        else if(key === "id_colore_interno") {
                            newObj[key] = (obj[key] || '') + ' - ' + (obj["descrizione_colore_interno"] || '');
                        }
                    }
                })
                newObj['comandi'] = (
                    <div 
                        className="d-flex justify-content-center gap-1 px-0 ms-0" 
                    >
                        <BottoneModifica
                            onOpenModal={disableCommands}
                            onCloseModal={enableCommands}
                            sampleForm={addForm}
                            row={obj}
                        ></BottoneModifica>
                        <BottoneElimina
                            onOpenModal={disableCommands}
                            onCloseModal={enableCommands}
                            sampleForm={addForm}
                            row={obj}
                        ></BottoneElimina>
                    </div>
                );
                return newObj;
            })
            setScarichi(scarichi);
            setTotalPages(dati.totalPages);
        }
        catch (error) {
            if (error.status === 401) {
                navigate("/login");
            }
            setError("Errore interno");
            setScarichi([]);
        }
        finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        checkAuth();    

        const searchParams = new URLSearchParams(location.search);
        const newFilters = {};

        for (const [key, value] of searchParams.entries()) {
            newFilters[key] = value;
        }

        setFilters((prev) => ({
            ...prev,
            ...newFilters
        }));

        fetchScarichi();
    }, [location.pathname, location.search])

    if(!isAdmin()) {
        return (<div>Non sei autenticato</div>)
    }

    return (
        <div className="under-navbar-pagine" tabIndex={0} onKeyDown={handleKeyDown}>
            {error && <p className="text-danger">Errore: {error}</p>}
            <div
                className="table-container"
            >
                <Table
                    titles={titoli}
                    data={scarichi}
                />
            </div>
            <div className="d-flex">
                <BottoneFiltra 
                    ref={filterButtonRef} 
                    onApplyFilters={handleApplyFilters} 
                    onOpenModal={disableCommands}
                    onCloseModal={enableCommands}

                >
                    {filterForm()}
                </BottoneFiltra>
                <div className="flex-grow-1 d-flex justify-content-center align-items-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        setCurrentPage={setCurrentPage}
                    />
                </div>
                <div className="d-flex">
                    <BottoneAggiungi 
                        ref={addButtonRef} 
                        onApplyInsert={handleApplyInsert} 
                        onOpenModal={disableCommands}
                        onCloseModal={enableCommands}
                    >
                        {addForm()}
                    </BottoneAggiungi>
                </div>
            </div>
        </div>
    )
}

export default QuantitaProfili;
