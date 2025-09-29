import React, { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NavbarPages from "../../components/NavBar/NavbarPages";
import Table from "../../components/Table/Table";
import Pagination from "../../components/Table/Pagination";
import BottoneFiltra from "../../components/BottoneFiltra";

const HomePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);

    const filterButtonRef = useRef(null);
    const handleKeyDown = (event) => {
        if(!commandsDisabled) {
            if(event.keyCode === 70) {
                event.preventDefault();
                if(filterButtonRef.current) {
                    filterButtonRef.current.click();
                }
            }
        }
    }
    
    const pages = [
        { path: "/magazzino", title: "Home", adminOnly: false },
        { path: "/magazzino/scarichi", title: "Scarico", adminOnly: false },
        { path: "/magazzino/carichi", title: "Carico", adminOnly: true },
        { path: "/magazzino/qr", title: "QR Code", adminOnly: true },
        { path: "/magazzino/qr/elenco", title: "Elenco QR Code", adminOnly: false },
        { path: "/magazzino/ordini", title: "Materiale ordinato", adminOnly: false },
        { path: "/magazzino/consegne", title: "Materiale consegnato", adminOnly: false },
        { path: "/magazzino/profili", title: "Elenco profili", adminOnly: true },
        { path: "/magazzino/quantita", title: "Quantità minima", adminOnly: true },
        { path: "/magazzino/accessori", title: "Elenco accessori", adminOnly: true },
        { path: "/magazzino/colori", title: "Colori", adminOnly: true },
        { path: "/magazzino/valore", title: "Valore magazzino", adminOnly: true },
    ]

    const [profili, setProfili] = useState([]);
    const [_loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = parseInt(queryParams.get('limit')) || 25;
    const [commandsDisabled, setCommandsDisabled] = useState(false);
    
    const [filters, setFilters] = useState({
        q: queryParams.get("q") || "",
        id_colore_esterno: queryParams.get("id_colore_esterno") || "",
        id_colore_interno: queryParams.get("id_colore_interno") || "",
        fornitore: queryParams.get("fornitore") ||"",
        descrizione: queryParams.get("descrizione") ||"",
    })
    const titoli = [
        "Articolo" + (queryParams.get("q") ? '*':''), 
        "Colore esterno" + (queryParams.get("id_colore_esterno") ? '*':''), 
        "Colore interno" + (queryParams.get("id_colore_interno") ? '*':''), 
        "Qta in magazzino", 
        "Qta in ordine", 
        "Fornitore" + (queryParams.get("fornitore")? '*':''), 
        "Descrizione" + (queryParams.get("descrizione")? '*':'')
    ]

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }))
    }

    const disableCommands = () => {
        setCommandsDisabled(true);
    }
    const enableCommands = () => {
        setCommandsDisabled(false);
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
            </div>
        );
    }


    const fetchProfili = async () => {
        setLoading(true);
        setError(null);

        try {
            const searchQuery = queryParams.get("q") || "";
            const response = await fetch(`/api/magazzino?id_prodotto=${searchQuery}&limit=${itemsPerPage}&page=${currentPage}&${new URLSearchParams(filters).toString()}`);
            if(!response.ok) throw Error("Errore interno");

            const dati = await response.json();
            const data = dati.data;
            const valoriDaTenere = ["id_prodotto", "id_colore_esterno", "id_colore_interno", "quantita_in_magazzino", "quantita_in_ordine", "fornitore", "descrizione"];
            const profili = data.map(obj => {
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                        if(key === "quantita_in_magazzino") {
                            newObj[key] += ' Pz'
                        }
                        else if(key === "quantita_in_ordine") {
                            newObj[key] += ' Pz'
                        }
                        else if(key === "id_colore_esterno") {
                            newObj[key] += ' - ' + obj["descrizione_colore_esterno"];
                        }
                        else if(key === "id_colore_interno") {
                            newObj[key] = (obj[key] || '') + ' - ' + (obj["descrizione_colore_interno"] || '');
                        }
                    }
                })
                return newObj;
            })
            setProfili(profili);
            setTotalPages(dati.totalPages);
        }
        catch (error) {
            setError(error.message);
            setProfili([]);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if(location.pathname === "/magazzino") {
            const searchParams = new URLSearchParams(location.search);
            const newFilters = {};

            for (const [key, value] of searchParams.entries()) {
                newFilters[key] = value;
            }

            setFilters((prev) => ({
                ...prev,
                ...newFilters
            }));
            fetchProfili();
        }
    }, [location.pathname, location.search])

    return (
        <div className="h-100 d-flex flex-column">
            <NavbarPages pages={pages}/>
            {location.pathname === "/magazzino" && (
                <div className="under-navbar-pagine" tabIndex={0} onKeyDown={handleKeyDown}>
                    {error && <p className="text-danger">Errore: {error}</p>}
                    <div
                        className="table-container"

                    >
                        <Table
                            titles={titoli}
                            data={profili}
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
            )}
            <Outlet />
        </div>
    )
}

export default HomePage;
