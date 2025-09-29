import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteVetroApi, getVetriApi } from "../../api/ordini/vetri"
import Loading from "../../components/Loading"
import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import Error from "../../components/Error";
import ConsegnaVetro from "../../components/ordini/vetri/ConsegnaVetro";
import ModificaOrdineVetro from "../../components/ordini/vetri/ModificaOrdineVetro";
import Trash from "../../assets/trash.svg";

const VetriLotti = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        q: searchParams.get("q") || "",
        lotto: searchParams.get("lotto") || "",
        status: searchParams.get("status") || "partial",
        page: parseInt(searchParams.get("page") || "1", 10),
        limit: parseInt(searchParams.get("limit") || "25", 10),
        sort_by: searchParams.get("sort_by") || "lotto",
        sort_order: searchParams.get("sort_order") === "asc" ? "asc" : "desc"
    });
    const [queryFilters, setQueryFilters] = useState(filters);

    useEffect(() => {
        const q = searchParams.get("q") || "";

        setQueryFilters((prev) => ({ ...prev, q }))
    }, [searchParams])

    const { data, isLoading, error } = useQuery({
        queryKey: ["vetri", queryFilters],
        queryFn: () => { 
            // setExpanded([]);
            return getVetriApi(queryFilters);
        },
    })

    const queryClient = useQueryClient();
    const deleteMutation = useMutation({
        mutationFn: (id) => {
            deleteVetroApi(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vetri", queryFilters] })
        },
        onError: (e) => {
            alert("Error");
            console.error(e);
        }
    })

    const [expanded, setExpanded] = useState([]);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const filterButtonRef = useRef(null);

    const onKeyDown = (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

        if (e.key.toLowerCase() === "f") {
            setShowFilterModal(true)
        }
    }

    const submitFilters = (e) => {
        e.preventDefault();
        setQueryFilters({...filters});

        const params = {};
        Object.keys(filters).forEach(key => {
            if (filters[key] !== "" && filters[key] !== null && filters[key] !== undefined) {
                params[key] = filters[key];
            }
        });
        setShowFilterModal(false);
        setSearchParams(params);
    }

    const onFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const changeSort = (element) => {
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            const currentSortBy = params.get("sort_by");
            const currentSortOrder = params.get("sort_order") || "desc";

            if (currentSortBy === element) {
                params.set("sort_order", currentSortOrder === "desc" ? "asc" : "desc");
            }
            else {
                params.set("sort_by", element);
                params.set("sort_order", "desc");
            }

            setQueryFilters((prev) => ({
                ...prev,
                sort_by: params.get("sort_by"),
                sort_order: params.get("sort_order"),
            }))

            return params;
        })
    }

    const changePage = (pageNumber) => {
        setQueryFilters((prev) => ({
            ...prev,
            page: pageNumber
        }))
    }

    const deleteOrdine = (id) => {
        deleteMutation.mutate(id);
    }
    
    return (
        <>
            <div 
                className="flex-grow-1 w-100 overflow-scroll"
                onKeyDown={onKeyDown}
                tabIndex={0}
            >
                <table className="w-100">
                    <thead>
                        <tr className="table-row">
                            <th 
                                className="table-header"
                                onClick={() => changeSort("lotto")}
                                role="button"
                            >
                                {searchParams.get("sort_by") === "lotto" && 
                                    (searchParams.get("sort_order") === "desc" ?
                                        "↓ " : "↑ ")
                                }
                                Lotto
                                {searchParams.get("lotto") && "*"}
                            </th>
                            <th className="table-header">
                                Vetri
                            </th>
                            <th 
                                className="table-header"
                                onClick={() => changeSort("quantita_totale")}
                                role="button"
                            >
                                {searchParams.get("sort_by") === "quantita_totale" && 
                                    (searchParams.get("sort_order") === "desc" ?
                                        "↓ " : "↑ ")
                                }
                                Quantità totale
                            </th>
                            <th 
                                className="table-header"
                                onClick={() => changeSort("quantita_consegnata")}
                                role="button"
                            >
                                {searchParams.get("sort_by") === "quantita_consegnata" && 
                                    (searchParams.get("sort_order") === "desc" ?
                                        "↓ " : "↑ ")
                                }
                                Quantità consegnata
                            </th>
                            <th 
                                className="table-header"
                                onClick={() => changeSort("data_consegna")}
                                role="button"
                            >
                                {searchParams.get("sort_by") === "data_consegna" && 
                                    (searchParams.get("sort_order") === "desc" ?
                                        "↓ " : "↑ ")
                                }
                                Data consegna
                            </th>
                            <th 
                                className="table-header"
                            >
                                Stato
                                {searchParams.get("status") !== "all" && "*"}
                            </th>
                            <th className="table-header">
                                Comandi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {error ? (<>
                            <tr>
                                <td colSpan={5}>
                                    <Error error={error}/>
                                </td>
                            </tr>
                        </>): 
                            isLoading ? (<tr>
                                <td colSpan={5}>
                                    <Loading></Loading>
                                </td> 
                            </tr>) : 
                                (<>
                                    {data.data.map((lotto, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="table-row">
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    {lotto.lotto}
                                                </td>
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm"
                                                        style={{
                                                            transition: "transform 0.3s ease",
                                                            transform: expanded.includes(lotto.lotto) ? "rotate(180deg)":""
                                                        }}
                                                        onClick={() => {
                                                            setExpanded((prev) => {
                                                                if (prev.includes(lotto.lotto)) {
                                                                    return prev.filter((row) => row !== lotto.lotto);
                                                                }
                                                                else {
                                                                    return [...prev, lotto.lotto]
                                                                }
                                                            })
                                                        }}
                                                    >
                                                        <i className="bi bi-caret-down-fill"></i>
                                                    </button>
                                                </td>
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    {lotto.quantita_totale || 0} Pz
                                                </td>
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    {lotto.quantita_consegnata || 0} Pz
                                                </td>
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    {lotto.vetri.length > 0
                                                        ? new Date(
                                                            lotto.vetri.reduce((min, current) =>
                                                                new Date(current.data_consegna) < new Date(min.data_consegna) ? current : min
                                                            ).data_consegna
                                                        ).toLocaleDateString("it-IT")
                                                        : "—"}
                                                </td>
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    {lotto.quantita_totale > lotto.quantita_consegnata ? 
                                                        "Parziale" : "Completo"
                                                    }
                                                </td>
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                </td>
                                            </tr>
                                            {lotto.vetri.map((vetro, index2) => (
                                                <tr key={index2} className={`table-row ${expanded.includes(lotto.lotto) ? "" : "d-none"}`}>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {vetro.riferimento}
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {vetro.numero_vetri} Pz
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {vetro.numero_vetri * vetro.consegnato} Pz
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {new Date(vetro.data_consegna).toLocaleDateString("it-IT")}
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {vetro.consegnato ? "Consegnato" : "Ordinato"}
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        <div className="d-flex justify-content-center align-items-center gap-1">
                                                            {!vetro.consegnato && (
                                                                <ConsegnaVetro vetro={vetro}/>
                                                            )}
                                                            <ModificaOrdineVetro vetro={vetro} />
                                                            <button
                                                                className="btn btn-sm btn-light"
                                                                onClick={() => deleteOrdine(vetro.id)}
                                                            >
                                                                <img width="20" src={Trash} alt="trash"/>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </>)}
                    </tbody>
                </table>
            </div>
            <div className="w-100 position-relative d-flex justify-content-between">
                <div className="p-1">
                    <button 
                        ref={filterButtonRef} 
                        className="btn btn-primary flex-shrink-0 d-block mx-1"
                        onClick={() => {setShowFilterModal(prev => !prev)}}
                    >
                        <svg role="button" id="colore-esterno-filter" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/></svg>
                        <span className="d-none d-lg-inline">
                            &nbsp;Filtra
                        </span>
                    </button>
                </div>
                {data && 
                    <div 
                        className="position-absolute top-0 pagination"
                        style={{
                            left: "50%",
                            transform: "translateX(-50%)"
                        }}
                    >
                        <button 
                        disabled={!data.currentPage || data.currentPage == 1}
                        onClick={() => changePage(1)}
                        >
                        Inizio
                        </button>
                        {data.currentPage && data.currentPage > 1 && 
                            <button
                                onClick={() => changePage(data.currentPage - 1)}
                            >
                                {data.currentPage - 1}
                            </button>
                        }
                        <button className="bg-primary">
                        {data.currentPage || 1}
                        </button>
                        {data.currentPage && data.currentPage < data.totalPages && 
                            <button
                                onClick={() => changePage(data.currentPage + 1)}
                            >
                                {data.currentPage + 1}
                            </button>
                        }
                        <button 
                            disabled={data.currentPage == data.totalPages}
                            onClick={() => changePage(data.totalPages)}
                        >
                            Fine
                        </button>
                    </div>
                }
                <div className="p-1">
                    <Link style={{textDecoration: "none"}} to="/ordini/vetri/aggiungi">
                        <button 
                            className="btn btn-primary flex-shrink-0 d-block mx-1"
                        >
                            + 
                            <span className="d-none d-lg-inline">
                                &nbsp;Aggiungi
                            </span>
                        </button>
                    </Link>
                </div>

                <Modal centered show={showFilterModal} onHide={() => setShowFilterModal(false)}>
                    <Modal.Header>
                        <Modal.Title>Filtra</Modal.Title>
                    </Modal.Header>
                    <form 
                        onSubmit={submitFilters}
                    >
                        <Modal.Body>
                            <div
                                className="d-flex flex-column gap-3"
                            >
                                <div>
                                    <label htmlFor="lotto">Lotto</label>
                                    <input
                                        type="number" 
                                        placeholder="lotto" 
                                        name="lotto"
                                        id="lotto"
                                        className="form-control"
                                        onChange={onFilterChange}
                                        value={filters.lotto}
                                    />
                                </div>
                                <div className="d-flex flex-column">
                                    <label htmlFor="status">Stato</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={filters.status}
                                        onChange={(e) => {
                                            setFilters((prev) => ({
                                                ...prev,
                                                status: e.target.value
                                            }));
                                        }}
                                    >
                                        <option value="all">Tutti</option>
                                        <option value="partial">Parziale</option>
                                        <option value="complete">Completo</option>
                                    </select>
                                </div>
                                <div className="d-flex flex-column">
                                    <label htmlFor="limit">Elementi per pagina</label>
                                    <select
                                        id="limit"
                                        name="limit"
                                        value={filters.limit}
                                        onChange={(e) => {
                                            setFilters((prev) => ({
                                                ...prev,
                                                limit: e.target.value
                                            }));
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <button className="btn btn-secondary"
                                onClick={() => setShowFilterModal(false)}
                            >
                                Chiudi
                            </button>
                            <button className="btn btn-primary">
                                Applica filtri
                            </button>
                        </Modal.Footer>
                    </form>
                </Modal>
            </div>
        </>
    )
}

export default VetriLotti;
