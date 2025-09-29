import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Table from "../../components/Table/Table";
import Pagination from "../../components/Table/Pagination";
import BottoneFiltra from "../../components/BottoneFiltra";
import { useUser } from "../../contexts/UserContext";
import Logo from "../../assets/logo.png"

const ValoreMagazzino = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const { isAdmin, checkAuth } = useUser();
    const [valoreTotale, setValoreTotale] = useState(0.);
    const [data, setData] = useState([]);
    const pageToPrintRef = useRef(null);
    const [pageToPrintContent, setPageToPrintContent] = useState(null);

    const filterButtonRef = useRef(null);
    
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
        id_colore_interno: queryParams.get("id_colore_interno") ||"",
        fornitore: queryParams.get("fornitore") ||"",
        descrizione: queryParams.get("descrizione") ||"",
    })
    const titoli = [
        "Articolo" + (queryParams.get("q") ? '*':''), 
        "Colore esterno" + (queryParams.get("id_colore_esterno") ? '*':''), 
        "Colore interno" + (queryParams.get("id_colore_interno") ? '*':''), 
        "Valore in magazzino",
        "Valore in ordine",
        "Qta in magazzino", 
        "Lunghezza barra", 
        "Fornitore" + (queryParams.get("fornitore")? '*':''), 
        "Descrizione" + (queryParams.get("descrizione")? '*':''), 
    ];

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

    const fetchScarichi = async () => {
        setLoading(true);
        setError(null);

        try {
            let response = await fetch("/api/magazzino/valore/totale")

            if (!response.ok) throw response;
            let data = (await response.json()).data; 

            const totale = data.reduce((previous, current) => {
                return previous + (parseFloat(current.valore_in_magazzino) || 0);
            }, 0)
            setValoreTotale(new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totale));
            setData(data);

            const searchQuery = queryParams.get("q") || "";
            response = await fetch(
                `/api/magazzino/valore?id_prodotto=${searchQuery}
                &limit=${itemsPerPage}&page=${currentPage}
                &${new URLSearchParams(filters).toString()}`);

            if(!response.ok) throw Error("Errore interno");

            const dati = await response.json();
            data = dati.data;
            const valoriDaTenere = [
                "id_prodotto", 
                "id_colore_esterno", 
                "id_colore_interno", 
                "valore_in_magazzino", 
                "valore_in_ordine", 
                "quantita_in_magazzino",
                "lunghezza_barra",
                "fornitore",
                "descrizione",
            ];
            const scarichi = data.map(obj => {
                const newObj = {};
                valoriDaTenere.forEach(key => {
                    if(obj.hasOwnProperty(key)) {
                        newObj[key] = obj[key];
                        if(key === "quantita_in_magazzino") {
                            newObj[key] += ' Pz'
                        }
                        else if (key === "lunghezza_barra") {
                            newObj[key] += " m";
                        }
                        else if (key === "valore_in_magazzino" || key === "valore_in_ordine") {
                            newObj[key] = "€" + new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(newObj[key]);
                        }
                        else if (key === "id_prodotto") {
                            newObj[key] += "*" + obj.id_colore_esterno + (obj.id_colore_interno || "") + "*"
                        }
                        else if(key === "quantita") {
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

    const generatePDF = async () => {
        if (!data) return;
        try {
            let response = await fetch("/api/magazzino/valore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(filters),
            })

            if (!response.ok) throw response;
            const { data } = await response.json();


            const totale = data.reduce((previous, current) => {
                return previous + (parseFloat(current.valore_in_magazzino) || 0);
            }, 0)

            let filtersActive = [];
            const keys = Object.keys(filters);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const value = filters[key];
                switch (keys[i]) {
                    case "q":
                        if (value?.trim()) {
                            filtersActive.push({
                                title: "Id articolo",
                                value: value
                            })
                        }
                        break;
                    case "id_colore_esterno":
                        if (value?.trim()) {
                            filtersActive.push({
                                title: "Id colore esterno",
                                value: value
                            })
                        }
                        break;
                    case "id_colore_interno":
                        if (value?.trim()) {
                            filtersActive.push({
                                title: "Id colore interno",
                                value: value
                            })
                        }
                        break;
                    case "fornitore":
                        if (value?.trim()) {
                            filtersActive.push({
                                title: "Fornitore",
                                value: value
                            })
                        }
                        break;
                    case "descrizione":
                        if (value?.trim()) {
                            filtersActive.push({
                                title: "Descrizione",
                                value: value
                            })
                        }
                        break;
                    default:
                        break;
                }
            }

            const page = (
                <div style={{fontFamily: "sans-serif"}}>
                    <img src={Logo} alt="planetWindows" height={50}/>
                    <div style={{display: "flex", justifyContent: "space-between"}}>
                        <h4>Recap magazzino</h4>
                        <div>Data: {new Date().toLocaleString('it', {'day': '2-digit', 'month': '2-digit', 'year': '2-digit'})}</div>
                    </div>
                    {filtersActive && (
                        <ul>
                            Filtri attivi: 
                            {filtersActive.map((row, index) => (
                                <li key={index}>{row.title}: {row.value}</li>
                            ))}
                        </ul>
                    )}
                    <div style={{fontSize: "20px"}}>Valore totale in magazzino: €{new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totale)}</div>
                    <hr/><br/>
                    <table>
                        <thead>
                            <tr style={{borderBottom: "1px solid black"}}>
                                <th scope="col">Articolo</th>
                                <th scope="col">Colore esterno</th>
                                <th scope="col">Colore interno</th>
                                <th scope="col">V. in magazzino</th>
                                <th scope="col">L. barra</th>
                                <th scope="col">Qta</th>
                                <th scope="col">Fornitore</th>
                                <th scope="col">Descrizione</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr style={{borderBottom: "1px solid black"}} key={index}>
                                    <td>{row.id_prodotto}*{row.id_colore_esterno}{row.id_colore_interno}*</td> 
                                    <td>{row.id_colore_esterno} - {row.descrizione_colore_esterno}</td> 
                                    <td>{row.id_colore_interno} - {row.descrizione_colore_interno}</td> 
                                    <td>€{new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.valore_in_magazzino)}</td> 
                                    <td>{row.lunghezza_barra} m</td> 
                                    <td>{row.quantita_in_magazzino} Pz</td> 
                                    <td>{row.fornitore}</td> 
                                    <td>{row.descrizione}</td> 
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )

            setPageToPrintContent(page);
            setTimeout(() => {
                const printWindow = window.open('', '_blank', 'height=400,width=800');
                printWindow.document.write(`
                <html>
                <head>
                    <title>Recap</title>
                    <style>
                        * {
                            font-size: 12px;
                        }
                        table, th, td {
                            border-collapse: collapse;
                        }
                        tr {
                            border-bottom: 1px solid black;
                            padding: 6px;
                            margin: 2px;
                            page-break-inside: avoid;
                            break-inside: avoid;
                        }
                        tr, td, th {
                            padding: 6px;
                        }
                    </style>
                </head>
                <body>
                    ${pageToPrintRef.current.innerHTML}
                </body>
                </html>
                `)
                printWindow.document.close();
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 50)
            }, 50);
        } 
        catch (e) {
            if (e.status === 401) {
                navigate("/login");
            }
            console.error(e);
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

    if (!isAdmin) {
        return (<>Non sei autenticato</>);
    }

    return (
        <div className="under-navbar-pagine d-flex flex-column h-100" tabIndex={0} onKeyDown={handleKeyDown}>
            <div className="container-fluid  fs-4">
                <div className="row h-100">
                    <div 
                        className="
                            col-12 col-lg-4 
                            text-white p-1
                        "
                    >
                        <div className="w-100 h-100 d-flex justify-content-center align-items-center" style={{backgroundColor: "rgb(20,39,64)", minHeight: "60px"}}>
                            Valore totale: €{valoreTotale}
                        </div>
                    </div>
                    <div className="col-0 col-lg-4 p-0 m-0 p-lg-1">
                        <div className="w-100 h-100" style={{backgroundColor: "rgb(212,212,212)"}}>

                        </div>
                    </div>
                    <div className="col-12 col-lg-4 d-flex p-1 justify-content-center align-items-center" style={{minHeight: "60px"}}>
                        <button 
                            className="form-control fs-4 genera-pdf-button" 
                            onClick={generatePDF}
                        >
                            Genera PDF 📋
                        </button>
                    </div>
                </div>
            </div>
            <div
                className="table-container flex-grow-1"
                style={{height: "unset"}}
            >
                <Table
                    titles={titoli}
                    data={scarichi}
                />
            </div>
            {error && <p className="text-danger p-2">Errore: {error}</p>}
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
            </div>
            <div className="d-none" ref={pageToPrintRef}>{pageToPrintContent}</div>
        </div>
    )
}

export default ValoreMagazzino;
