import React, { useRef } from "react";
import { Link, Links, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Table from "../../components/Table/Table";
import Pagination from "../../components/Table/Pagination";
import BottoneFiltra from "../../components/BottoneFiltra";
import BottoneModifica from "../../components/BottoneModifica";
import BottoneElimina from "../../components/BottoneElimina";

const VetriConsegnati = () => {
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
    const defaultFilters = {
        q: queryParams.get("q") || "",
        lotto: queryParams.get("lotto") || "",
        data: queryParams.get("data") ||"",
    }
    const [filters, setFilters] = useState(defaultFilters)
    const defaultNewScarico = {
        riferimento: "",
        errore_riferimento: "",
        lotto: "",
        errore_lotto: "",
        numero_vetri: 1,
        errore_numero_vetri: "",
        data_consegna: "",
        errore_data: "",
    };
    const [newScarico, setNewScarico] = useState(defaultNewScarico);
    const titoli = [
        "Riferimento" + (queryParams.get("riferimento") ? '*':''), 
        "Lotto" + (queryParams.get("lotto") ? '*':''), 
        "Quantità", 
        "Data consegna" + (queryParams.get("data")? '*':''), 
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
                <div className="text-danger" id="errore_id_prodotto">{newScarico.errore_riferimento}</div>
                <br/>

                <label htmlFor="lotto">Lotto</label><br/>
                <input 
                    type="number" 
                    placeholder="lotto" 
                    name="lotto"
                    id="lotto"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.lotto}
                />
                <div className="text-danger" id="errore_id_prodotto">{newScarico.errore_lotto}</div>
                <br/>

                <label htmlFor="numero_vetri">Quantità ordinata (Pz)</label><br/>
                <input 
                    type="number" 
                    step="1"
                    min="1"
                    placeholder="quantita" 
                    name="numero_vetri"
                    id="numero_vetri"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.numero_vetri}
                />
                <div className="text-danger"id="errore_numero_vetri">{newScarico.errore_numero_vetri}</div>
                <br/>

                <label htmlFor="data">Data consegna</label><br/>
                <input 
                    type="date" 
                    placeholder={new Date().getDate()} 
                    name="data_consegna"
                    id="data"
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
                <label htmlFor="q">Riferimento</label><br/>
                <input 
                    type="text" 
                    placeholder="riferimento" 
                    name="q"
                    id="q"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.q}
                />
                <br/>

                <label htmlFor="lotto">Lotto</label><br/>
                <input 
                    type="number" 
                    placeholder="lotto" 
                    name="lotto"
                    id="lotto"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.lotto}
                />
                <br/>

                <label htmlFor="data_consegna">Data consegna</label><br/>

                <input 
                    type="date" 
                    name="data_consegna"
                    id="data_consegna"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.data_consegna}
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
            const response = await fetch(`/api/ordini/vetri/consegnati?riferimento=${searchQuery}&limit=${itemsPerPage}&page=${currentPage}&${new URLSearchParams(filters).toString()}`);
            if(!response.ok) throw response;

            const dati = await response.json();
            const data = dati.data;
            const valoriDaTenere = [
                "riferimento", 
                "lotto",
                "numero_vetri", 
                "data_consegna", 
            ];
            const scarichi = data.map(obj => {
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                        if(key === "numero_vetri") {
                            newObj[key] += ' Pz'
                        }
                        else if(key === "data_consegna") {
                            newObj[key] = new Date(obj[key]).toLocaleDateString("it-It");
                        }
                    }
                })
                newObj['comandi'] = (
                    <div 
                        className="d-flex justify-content-center gap-1 px-0 ms-0" 
                    >
                        <BottoneModifica 
                            customLink={`/api/ordini/vetri/${obj.id}`}
                            onOpenModal={disableCommands}
                            onCloseModal={enableCommands}
                            sampleForm={addForm}
                            row={obj}
                            credentialsNeeded={true}
                        />
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
            setError(error.message);
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
            <div className="table-container">
                <Table titles={titoli} data={scarichi} />
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

export default VetriConsegnati;

