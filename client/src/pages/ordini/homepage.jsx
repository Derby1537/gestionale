import React, { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import NavbarPages from "../../components/NavBar/NavbarPages";
import Table from "../../components/Table/Table";
import Pagination from "../../components/Table/Pagination";
import BottoneFiltra from "../../components/BottoneFiltra";
import BottoneModifica from "../../components/BottoneModifica";
import BottoneElimina from "../../components/BottoneElimina";
import BottoneAggiungi from "../../components/BottoneAggiungi";
import BottoneAggiungiOrdine from "../../components/BottoneAggiungiOrdine"
import { useUser } from "../../contexts/UserContext";
import { Button } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import { getPezziTotaliApi } from "../../api/ordini/ordini";

const HomePage = () => {
    const { checkAuth, isAdmin } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);

    const [totale, setTotale] = useState({ infissi: 0, cassonetti: 0 });

    const filterButtonRef = useRef(null);
    const addButtonRef = useRef(null);

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
   
    const pages = [
        { path: "/ordini", title: "Home", adminOnly: true },
        { path: "/ordini/lotti", title: "Ordini in produzione", adminOnly: true },
        { path: "/ordini/vetri", title: "Vetri", adminOnly: true },
        { path: "/ordini/vetri_ordinati", title: "Vetri ordinati", adminOnly: true },
        { path: "/ordini/vetri_consegnati", title: "Vetri consegnati", adminOnly: true },
    ]

    const [profili, setProfili] = useState([]);
    const [_loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = parseInt(queryParams.get('limit')) || 25;
    const [commandsDisabled, setCommandsDisabled] = useState(false);

    const [newScarico, setNewScarico] = useState({
        numero_ordine: "",
        errore_numero_ordine: "",
        numero_cliente: "",
        id_colore_esterno: queryParams.get("id_colore_esterno") || "",
        errore_id_colore_esterno: "",
        id_colore_interno: queryParams.get("id_colore_interno") ||"",
        errore_id_colore_interno: "",
        numero_infissi: 0,
        errore_infissi: "",
        numero_cassonetti: 0,
        errore_cassonetti: "",
        ok_prod: false,
    })
    
    const [filters, setFilters] = useState({
        q: queryParams.get("q") || "",
        numero_cliente: queryParams.get("numero_cliente") || "",
        data: (queryParams.get("data") ? new Date(queryParams.get("data")) : ""),
        ok_prod: queryParams.get("ok_prod") || "1",
        produzione: queryParams.get("produzione") || "0",
        id_colore_esterno: queryParams.get("id_colore_esterno") || "",
        id_colore_interno: queryParams.get("id_colore_interno") || "",
        profilo: queryParams.get("profilo") || "",
        consegna_vetri: (queryParams.get("consegna_vetri") ? new Date(queryParams.get("consegna_vetri")) : ""),
        consegna_profili: (queryParams.get("consegna_profili") ? new Date(queryParams.get("consegna_profili")) : ""),
    })
    const titoli = [
        "N. ordine" + (queryParams.get("q") ? '*':''), 
        "N. cliente" + (queryParams.get("numero_cliente") ? '*':''), 
        "Data" + (queryParams.get("data") ? '*':''), 
        "Ok prod" + "*", 
        "Colore esterno" + (queryParams.get("id_colore_esterno") ? '*':''), 
        "Colore interno" + (queryParams.get("id_colore_interno") ? '*':''), 
        "Profilo" + (queryParams.get("profilo") ? '*':''), 
        "Infissi", 
        "Cassonetti", 
        "Consegna vetri" + (queryParams.get("consegna_vetri") ? '*':''),
        "Consegna profili" + (queryParams.get("consegna_profili") ? '*':''),
        "Comandi",
    ]

    const handleFilterChange = (e) => {
        let { name, value } = e.target;
        if (name === "ok_prod" && value === "") {
            value = null;
        }
        else if (name === "produzione" && value === "") {
            value = null;
        }
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
                <label htmlFor="q">Numero ordine</label><br/>
                <input 
                    type="text" 
                    placeholder="numero ordine" 
                    name="q"
                    id="q"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.q}
                />
                <br/>

                <label htmlFor="numero_cliente">Numero cliente</label><br/>
                <input 
                    type="text" 
                    placeholder="numero cliente" 
                    name="numero_cliente"
                    id="numero_cliente"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.numero_cliente}
                />
                <br/>

                <label htmlFor="data">Data</label><br/>
                <input 
                    type="date" 
                    name="data"
                    id="data"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.data}
                />
                <br/>

                <label>Ok produzione</label>
                <br/>
                <input 
                    className="m-1"
                    type="radio"
                    id="tutti"
                    name="ok_prod"
                    onChange={handleFilterChange}
                    value=""
                    checked={filters.ok_prod === null || filters.ok_prod === ""}
                />
                <label htmlFor="tutti">Tutti</label>
                <br/>
                <input 
                    className="m-1"
                    type="radio"
                    id="si"
                    name="ok_prod"
                    onChange={handleFilterChange}
                    value="1"
                    checked={filters.ok_prod === "1"}
                />
                <label htmlFor="si">Si</label>
                <br/>
                <input 
                    className="m-1"
                    type="radio"
                    id="no"
                    name="ok_prod"
                    onChange={handleFilterChange}
                    value="0"
                    checked={filters.ok_prod === "0"}
                />
                <label htmlFor="no">No</label>
                <br/>
                <br/>

                <label>In produzione</label>
                <br/>
                <input 
                    className="m-1"
                    type="radio"
                    id="in_produzione_tutti"
                    name="produzione"
                    onChange={handleFilterChange}
                    value=""
                    checked={filters.produzione === null || filters.produzione === ""}
                />
                <label htmlFor="in_produzione_tutti">Tutti</label>
                <br/>
                <input 
                    className="m-1"
                    type="radio"
                    id="in_produzione_si"
                    name="produzione"
                    onChange={handleFilterChange}
                    value="1"
                    checked={filters.produzione === "1"}
                />
                <label htmlFor="in_produzione_si">Si</label>
                <br/>
                <input 
                    className="m-1"
                    type="radio"
                    id="in_produzione_no"
                    name="produzione"
                    onChange={handleFilterChange}
                    value="0"
                    checked={filters.produzione === "0"}
                />
                <label htmlFor="in_produzione_no">No</label>
                <br/>
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

                <label htmlFor="consegna_vetri">Consegna vetri</label><br/>
                <input 
                    type="date" 
                    name="consegna_vetri"
                    id="consegna_vetri"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.consegna_vetri}
                />
                <br/>

                <label htmlFor="consegna_profili">Consegna profili</label><br/>
                <input 
                    type="date" 
                    name="consegna_profili"
                    id="consegna_profili"
                    className="form-control"
                    onChange={handleFilterChange}
                    value={filters.consegna_profili}
                />
                <br/>
            </div>
        );
    }

    const handleApplyInsert = async () => {
        try {
            const response = await fetch("/api/ordini", {
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
                numero_cliente: "",
                data: "",
                ok_prod: "",
                produzione: "",
                id_colore_esterno: "",
                id_colore_interno: "",
                profilo: "",
                consegna_vetri: "",
                consegna_profili: "",
            })
            handleApplyFilters();

            setNewScarico({
                numero_ordine: "",
                errore_numero_ordine: "",
                numero_cliente: "",
                id_colore_esterno: queryParams.get("id_colore_esterno") || "",
                errore_id_colore_esterno: "",
                id_colore_interno: queryParams.get("id_colore_interno") ||"",
                errore_id_colore_interno: "",
                numero_infissi: 1,
                errore_infissi: "",
                numero_cassonetti: 1,
                errore_cassonetti: "",
                ok_prod: false,
            })
            alert(data.message);
            return true;
        }
        catch (error) {
            setNewScarico((prevFilters) => ({
                ...prevFilters,
                errore_numero_ordine: "",
                errore_id_colore_esterno: "",
                errore_id_colore_interno: "",
                errore_infissi: "",
                errore_cassonetti: "",
                [error.field]: error.message,
            }))
            return false;
        }
    }
    const addForm = () => {
        return (
            <div>
                <label htmlFor="numero_ordine">Numero ordine</label><br/>
                <input 
                    type="text" 
                    placeholder="numero ordine" 
                    name="numero_ordine"
                    id="numero_ordine"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.numero_ordine}
                />
                <div className="text-danger" id="errore_numero_ordine">{newScarico.errore_numero_ordine}</div>
                <br/>

                <label htmlFor="numero_cliente">Numero cliente</label><br/>
                <input 
                    type="text" 
                    placeholder="numero cliente" 
                    name="numero_cliente"
                    id="numero_cliente"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.numero_cliente}
                />
                <br/>

                <input
                    name="ok_prod"
                    id="ok_prod"
                    type="checkbox"
                    className="m-1"
                    onChange={(e) => 
                        setNewScarico((prev) => ({
                            ...prev,
                            ok_prod: e.target.checked
                        }))
                    }
                    checked={newScarico.ok_prod}
                />
                <label htmlFor="ok_prod">Ok prod</label><br/>
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
                <div className="text-danger" id="errore_id_colore_esterno">{newScarico.errore_id_colore_esterno}</div>
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
                <div className="text-danger" id="errore_id_colore_interno">{newScarico.errore_id_colore_interno}</div>
                <br/>

                <label htmlFor="numero_infissi">Infissi</label><br/>
                <input 
                    type="number" 
                    min={0}
                    step={1}
                    placeholder="numero infissi" 
                    name="numero_infissi"
                    id="numero_infissi"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.numero_infissi}
                />
                <div className="text-danger" id="errore_infissi">{newScarico.errore_infissi}</div>
                <br/>

                <label htmlFor="numero_cassonetti">Cassonetti</label><br/>
                <input 
                    type="number" 
                    min={0}
                    step={1}
                    placeholder="numero cassonetti" 
                    name="numero_cassonetti"
                    id="numero_cassonetti"
                    className="form-control"
                    onChange={handleAddChange}
                    value={newScarico.numero_cassonetti}
                />
                <div className="text-danger" id="errore_cassonetti">{newScarico.errore_cassonetti}</div>
                <br/>
            </div>
        );
    }

    const fetchProfili = async () => {
        setLoading(true);
        setError(null);

        try {
            const searchQuery = queryParams.get("q") || "";
            const response = await fetch(`/api/ordini?numero_ordine=${searchQuery}&limit=${itemsPerPage}&page=${currentPage}&${new URLSearchParams(filters).toString()}`);
            if(!response.ok) 
                throw response;

            const dati = await response.json();
            const data = dati.data;
            const valoriDaTenere = [
                "numero_ordine", 
                "numero_cliente", 
                "data", 
                "ok_prod", 
                "id_colore_esterno", 
                "id_colore_interno", 
                "profilo", 
                "numero_infissi", 
                "numero_cassonetti", 
                "consegna_vetri",
                "consegna_profili",
            ];
            const profili = data.map(obj => {
                obj.id = obj.numero_ordine;
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                        if (key === "numero_infissi" ||
                            key === "numero_cassonetti") {
                            newObj[key] += ' Pz'
                        }
                        else if (key.startsWith("id_colore")) {
                            newObj[key] += " - " + obj["descrizione_" + key]
                        }
                        else if (key === "data" ||
                                 key === "consegna_vetri" || 
                                 key === "consegna_profili") {
                            if (obj[key]) {
                                newObj[key] = new Date(obj[key]).toLocaleDateString("it-It");
                            }
                            else {
                                newObj[key] = "";
                            }
                        }
                        else if (key === "ok_prod") {
                            newObj[key] = obj[key] ? "Si" : "No";
                        }
                        //else if(key === "id_colore_esterno") {
                        //    newObj[key] += ' - ' + obj["descrizione_colore_esterno"];
                        //}
                        //else if(key === "id_colore_interno") {
                        //    newObj[key] = (obj[key] || '') + ' - ' + (obj["descrizione_colore_interno"] || '');
                        //}
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

                        <BottoneAggiungiOrdine 
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
            setProfili(profili);
            setTotalPages(dati.totalPages);
            setTotale({
                infissi: dati.infissi,
                cassonetti: dati.cassonetti
            })
        }
        catch (error) {
            if (error.status === 401) {
                navigate("/login");
            }
            else {
                setError("Internal server error");
            }
            setProfili([]);
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const checkLogin = async () => {
            await checkAuth();
            if (!isAdmin) {
                navigate("/");
            }
        }
        checkLogin();
        if(location.pathname === "/ordini") {
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

    const calculateInfissiWidth = () => {
        if (!totale.infissi && !totale.cassonetti) return "50%";

        const tot = parseInt(totale.infissi, 10) + parseInt(totale.cassonetti, 10);
        const percentualeInfissi = totale.infissi / tot;

        if (percentualeInfissi < 0.25) {
            return "25%";
        }
        if (percentualeInfissi > 0.75) {
            return "75%";
        }
        return percentualeInfissi * 100 + "%";
    }

    if (!isAdmin) {
        return (<>Non sei autenticato</>);
    }

    return (
        <div className="h-100 d-flex flex-column">
            <NavbarPages pages={pages}/>
            {location.pathname === "/ordini" && (
                <div className="under-navbar-pagine d-flex flex-column" tabIndex={0} onKeyDown={handleKeyDown}>
                    {error && <p className="text-danger">Errore: {error}</p>}

                    <div className="d-flex w-100 p-1 gap-1 text-white">
                        <div 
                            className="d-flex justify-content-between p-1 fs-4"
                            style={ { width: calculateInfissiWidth(), backgroundColor: "#142740" } }
                        >
                            <div>
                                Totale infissi: 
                            </div>
                            <div>
                                {totale.infissi} Pz
                            </div>
                        </div>
                        <div className="d-flex justify-content-between flex-grow-1 p-1 fs-4 bg-primary">
                            <div>
                                Totale cassonetti: 
                            </div>
                            <div>
                                {totale.cassonetti} Pz
                            </div>
                        </div>
                    </div>

                    <div
                        className="table-container"

                    >
                        <Table
                            titles={titoli}
                            data={profili}
                        />
                    </div>
                    <div className="d-flex p-1">
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
                            <Link to="/ordini/aggiungi">
                                <Button>Aggiunta multipla</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
            <Outlet />
        </div>
    )
}

export default HomePage;
