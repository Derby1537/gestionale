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

const  AccessoriProfili = () => {
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
        fornitore: queryParams.get("fornitore") || "",
        descrizione: queryParams.get("descrizione") ||"",
    })
    const [newScarico, setNewScarico] = useState({
        id: "",
        errore_id: "",
        fornitore: "",
        descrizione: "",
    })
    const titoli = [
        "Articolo" + (queryParams.get("q") ? "*":""), 
        "Fornitore" + (queryParams.get("fornitore") ? "*":""), 
        "Descrizione" + (queryParams.get("descrizione")? '*':''), 
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
            const response = await fetch("/api/magazzino/accessori", {
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
                descrizione: "",
                fornitore: "",
            })
            handleApplyFilters();

            setNewScarico({
                id: "",
                errore_id: "",
                descrizione: "",
                fornitore: "",
            })
            alert(data.message);
            return true;
        }
        catch (error) {
            setNewScarico((prevFilters) => ({
                ...prevFilters,
                errore_id: "",
                [error.field]: error.message,
            }))
            return false;
        }
    }
    const addForm = () => {
        return (
            <div>
                <label htmlFor="id">Id accessorio</label><br/>
                <input 
                    type="text" 
                    placeholder="id accessorio" 
                    name="id"
                    id="id"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.id}
                />
                <div className="text-danger" id="errore_id">{newScarico.errore_id}</div>
                <br/>

                <label htmlFor="descrizione">Descrizione</label><br/>
                <input
                    placeholder="descrizione" 
                    name="descrizione"
                    id="descrizione"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.descrizione}
                />

                <br/>

                <label htmlFor="fornitore">Fornitore</label><br/>
                <input
                    placeholder="fornitore" 
                    name="fornitore"
                    id="fornitore"
                    className="form-control"
                    onChange={handleAddChange}
                    style={{ resize: 'none' }}
                    value={newScarico.fornitore}
                />

                <br/>
            </div>
        );
    }

    const filterForm = () => {
        return (
            <div>
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

                <label htmlFor="descrizione">Descrizione</label><br/>
                <input 
                    type="text" 
                    placeholder="descrizione" 
                    name="descrizione"
                    id="descrizione"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.descrizione}
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
            const response = await fetch(`/api/magazzino/accessori?id=${searchQuery}&limit=${itemsPerPage}&page=${currentPage}&${new URLSearchParams(filters).toString()}`);
            if(!response.ok) {
                throw response;
            }

            const dati = await response.json();
            const data = dati.data;
            const valoriDaTenere = [
                "id", 
                "fornitore", 
                "descrizione"
            ];
            const scarichi = data.map(obj => {
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
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
                            disabledFields={["id"]}
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

export default AccessoriProfili;
