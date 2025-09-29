import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Table from "../../components/Table/Table";
import BottoneModifica from "../../components/BottoneModifica";
import Pagination from "../../components/Table/Pagination";
import BottoneFiltra from "../../components/BottoneFiltra";
import BottoneElimina from "../../components/BottoneElimina";

const ConsegneProfili = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);

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
        riferimento: queryParams.get("riferimento") || "",
        q: queryParams.get("q") || "",
        id_colore_esterno: queryParams.get("id_colore_esterno") || "",
        id_colore_interno: queryParams.get("id_colore_interno") ||"",
        data: queryParams.get("data") ||"",
        fornitore: queryParams.get("fornitore") ||"",
    })
    const [newScarico, setNewScarico] = useState({
        riferimento: queryParams.get("riferimento") || "",
        id_prodotto: queryParams.get("id_prodotto") || "",
        errore_id_prodotto: "",
        id_colore_esterno: queryParams.get("id_colore_esterno") || "",
        errore_id_colore_esterno: "",
        id_colore_interno: queryParams.get("id_colore_interno") ||"",
        errore_id_colore_interno: "",
        quantita: queryParams.get("quantita") ||"",
        errore_quantita: "",
        data_consegna: queryParams.get("data_consegna") ||"",
        errore_data: "",
        consegnato: true,
    })
    const titoli = [
        "Riferimento" + (queryParams.get("riferimento") ? '*':''), 
        "Articolo" + (queryParams.get("q") ? '*':''), 
        "Colore esterno" + (queryParams.get("id_colore_esterno") ? '*':''), 
        "Colore interno" + (queryParams.get("id_colore_interno") ? '*':''), 
        "Qta ordinata", 
        "Data consegna" + (queryParams.get("data_consegna")? '*':''), 
        "Fornitore" + (queryParams.get("fornitore") ? "*":""), 
        "Stato", 
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

                <label htmlFor="id_colore_interno">Id colore interno</label><br/>
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

                <label htmlFor="riferimento">Riferimento</label><br/>
                <input 
                    type="text" 
                    placeholder="riferimento" 
                    name="riferimento"
                    id="riferimento"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.riferimento}
                />
                <br/>

                <label htmlFor="quantita">Quantità ordinata (Pz)</label><br/>
                <input 
                    type="number" 
                    step="1"
                    min="1"
                    placeholder="quantita" 
                    name="quantita"
                    id="quantita"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.quantita}
                />
                <div className="text-danger"id="errore_quantita">{newScarico.errore_quantita}</div>
                <br/>

                <label htmlFor="data_consegna">Data consegna</label><br/>
                <input 
                    type="date" 
                    placeholder={new Date().getDate()} 
                    name="data_consegna"
                    id="data_consegna"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.data_consegna}
                />
                <div className="text-danger"id="errore_data">{newScarico.errore_data}</div>
                <br/>

                <input 
                    type="checkbox" 
                    name="consegnato" 
                    id="consegnato" 
                    onChange={handleAddChange} 
                    checked={newScarico.consegnato}
                />
                <label htmlFor="consegnato">&nbsp;Consegnato</label>
            </div>
        );
    }

    const filterForm = () => {
        return (
            <div>
                <label htmlFor="riferimento">Riferimento</label><br/>
                <input 
                    type="text" 
                    placeholder="riferimento" 
                    name="riferimento"
                    id="riferimento"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.riferimento}
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
            </div>
        );
    }

    const fetchScarichi = async () => {
        setLoading(true);
        setError(null);

        try {
            const searchQuery = queryParams.get("q") || "";
            const response = await fetch(`/api/magazzino/consegne?id_prodotto=${searchQuery}&limit=${itemsPerPage}&page=${currentPage}&${new URLSearchParams(filters).toString()}`);
            if(!response.ok) throw response;

            const dati = await response.json();
            const data = dati.data;
            const valoriDaTenere = [
                "riferimento", 
                "id_prodotto", 
                "id_colore_esterno", 
                "id_colore_interno", 
                "quantita", 
                "data_consegna", 
                "fornitore"
            ];
            const scarichi = data.map(obj => {
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                        if(key === "quantita") {
                            newObj[key] += ' Pz'
                        }
                        else if (key === "id_prodotto") {
                            newObj[key] += '*' + obj["id_colore_esterno"] + (obj["id_colore_interno"] || "") + '*'
                        }
                        else if(key === "id_colore_esterno") {
                            newObj[key] += ' - ' + obj["descrizione_colore_esterno"];
                        }
                        else if(key === "id_colore_interno") {
                            newObj[key] = (obj[key] || '') + ' - ' + (obj["descrizione_colore_interno"] || '');
                        }
                        else if(key === "data_consegna") {
                            newObj[key] = new Date(obj[key]).toLocaleDateString("it-It");
                        }
                    }
                })
                newObj["stato"] = "Consegnato";
                newObj['comandi'] = (
                    <div 
                        className="d-flex justify-content-center gap-1 px-0 ms-0" 
                    >
                        <BottoneModifica
                            onOpenModal={disableCommands}
                            onCloseModal={enableCommands}
                            sampleForm={addForm}
                            row={obj}
                            credentialsNeeded={true}
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
            </div>
        </div>
    )
}

export default ConsegneProfili;
