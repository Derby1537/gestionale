import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Table from "../../components/Table/Table";
import BottoneAggiungi from "../../components/BottoneAggiungi";
import Pagination from "../../components/Table/Pagination";
import BottoneFiltra from "../../components/BottoneFiltra";
import BottoneModifica from "../../components/BottoneModifica";
import BottoneElimina from "../../components/BottoneElimina";
import BottoneRimuoviOrdine from "../../components/BottoneRimuoviOrdine"
import { useUser } from "../../contexts/UserContext";

const Lotti = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const { isAdmin } = useUser();

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
        nome_lotto: queryParams.get("nome_lotto") || "",
        infissi: queryParams.get("infissi") || "",
        cassonetti: queryParams.get("cassonetti") || "",
        profilo: queryParams.get("profilo") || "",
    }
    const [filters, setFilters] = useState(defaultFilters)
    const defaultNewScarico = {
        numero_lotto: "",
        errore_lotto: "",
        nome: "",
        profilo: "",
    };
    const [newScarico, setNewScarico] = useState(defaultNewScarico);
    const titoli = [
        "Lotto" + (queryParams.get("lotto") ? '*':''), 
        "Nome lotto" + (queryParams.get("nome_lotto") ? '*':''), 
        "Ordini", 
        "N. infissi", 
        "N. cassonetti", 
        "Profilo" + (queryParams.get("profilo") ? '*':''),
        "Data consegna", 
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
            const response = await fetch("/api/ordini/lotti/aggiungi/nuovo_lotto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newScarico),
            })
            if(!response.ok) {
                const errorData = await response.json();
                throw errorData;
            } 

            const data = await response.json();

            setFilters(defaultFilters)
            handleApplyFilters();

            setNewScarico(defaultNewScarico)
            alert(data.message);
            return true;
        }
        catch (error) {
            setNewScarico((prevFilters) => ({
                ...prevFilters,
                errore_lotto: "",
                [error.field]: error.message,
            }))
            return false;
        }
    }
    const addForm = () => {
        return (
            <div>
                <label htmlFor="numero_lotto">Numero lotto</label><br/>
                <input 
                    type="number" 
                    placeholder="numero lotto" 
                    name="numero_lotto"
                    id="numero_lotto"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.numero_lotto}
                />
                <div className="text-danger" id="errore_lotto">{newScarico.errore_lotto}</div>
                <br/>

                <label htmlFor="nome">Nome lotto</label><br/>
                <input 
                    type="text" 
                    placeholder="nome lotto" 
                    name="nome"
                    id="nome"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.nome}
                />
                <br/>

                <label htmlFor="profilo">Profilo</label><br/>
                <input 
                    type="text" 
                    placeholder="profilo" 
                    name="profilo"
                    id="profilo"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.profilo}
                />
                <br/>

            </div>
        );
    }

    const filterForm = () => {
        return (
            <div>
                <label htmlFor="q">Lotto</label><br/>
                <input 
                    type="text" 
                    placeholder="lotto" 
                    name="q"
                    id="q"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.q}
                />
                <br/>

                <label htmlFor="nome_lotto">Nome lotto</label><br/>
                <input 
                    type="text" 
                    placeholder="nome lotto" 
                    name="nome_lotto"
                    id="nome_lotto"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.nome_lotto}
                />
                <br/>

                <label htmlFor="profilo">Profilo</label><br/>
                <input 
                    type="text" 
                    placeholder="profilo"
                    name="profilo"
                    id="profilo"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.profilo}
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
            const response = await fetch(`/api/ordini/lotti?lotto=${searchQuery}&limit=${itemsPerPage}&page=${currentPage}&${new URLSearchParams(filters).toString()}`);
            if(!response.ok) throw response;

            const dati = await response.json();
            const data = dati.data;
            const valoriDaTenere = [
                "numero_lotto", 
                "nome", 
                "ordini",
                "numero_ordine", 
                "numero_infissi", 
                "numero_cassonetti", 
                "profilo", 
            ];
            const scarichi = data.map(obj => {
                obj.id = obj.numero_lotto;
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                        if(key === "numero_infissi" || key === "numero_cassonetti") {
                            newObj[key] += ' Pz'
                        }
                        else if (key === "ordini") {
                            if (obj[key].length === 0) {
                                newObj[key] = "";
                            }
                            else {
                                newObj[key] = []
                                obj[key].forEach(ordine => {
                                    newObj[key].push([
                                        "",
                                        "",
                                        ordine.numero_ordine,
                                        ordine.numero_infissi + " Pz",
                                        ordine.numero_cassonetti + " Pz",
                                        ordine.profilo,
                                        ordine.data_consegna ? new Date(ordine.data_consegna).toLocaleDateString("it-IT") : "",
                                        (
                                            <div className="d-flex justify-content-center gap-1 px-0 ms-0">
                                                <BottoneRimuoviOrdine 
                                                    onOpenModal={disableCommands}
                                                    onCloseModal={enableCommands}
                                                    lotto={obj}
                                                    ordine={ordine}
                                                    credentialsNeeded={true}
                                                />
                                            </div>
                                        )
                                    ]);
                                });
                            }
                        }
                    }
                })
                newObj['data_consegna'] = (<></>)
                newObj['comandi'] = (
                    <div 
                        className="d-flex justify-content-center gap-1 px-0 ms-0" 
                    >
                        <BottoneModifica 
                            customLink={`/api/ordini/lotti/modifica/${obj.id}`}
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
                {isAdmin() && 
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
                }
            </div>
        </div>
    )
}

export default Lotti;

