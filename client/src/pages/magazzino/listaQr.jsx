import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getElencoQr } from "../../api/elencoQr"
import Loading from "../../components/Loading"
import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import Error from "../../components/Error";
import Trash from "../../assets/trash.svg";
import Check from "../../assets/check.svg";
import { postScarico } from "../../api/magazzino/scarico";
import { deleteElencoQr, deleteLottoApi } from "../../api/magazzino/elencoQr"
import ModificaElencoQr from "../../components/ModificaElencoQr";
import { useUser } from "../../contexts/UserContext";

const ListaQr = () => {
    const { isAdmin } = useUser();
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        q: searchParams.get("q") || "",
        lotto: searchParams.get("lotto") || "",
        id_prodotto: searchParams.get("id_prodotto") || "",
        id_colore_esterno: searchParams.get("id_colore_esterno") || "",
        id_colore_interno: searchParams.get("id_colore_interno") || "",
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
        queryKey: ["elenco_qr", queryFilters],
        queryFn: () => { 
            // setExpanded([]);
            return getElencoQr(queryFilters);
        },
    })

    const queryClient = useQueryClient();
    const checkMutation = useMutation({
        mutationFn: (scarico) => {
            postScarico(scarico);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elenco_qr", queryFilters] })
        },
        onError: (e) => {
            alert("Error");
            console.error(e);
        }
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => {
            deleteElencoQr(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elenco_qr", queryFilters] })
        },
        onError: (e) => {
            alert("Error");
            console.error(e);
        }
    })
    const deleteLottoMutation = useMutation({
        mutationFn: (lotto) => {
            deleteLottoApi(lotto);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["elenco_qr", queryFilters] })
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

    const checkScarico = (scarico) => {
        checkMutation.mutate({ 
            lotto: scarico.lotto,
            id_prodotto: scarico.id_prodotto,
            id_colore_esterno: scarico.id_colore_esterno,
            id_colore_interno: scarico.id_colore_interno,
            quantita: scarico.quantita - (scarico.quantita_scaricata || 0)
        })
    }

    const deleteScarico = (id) => {
        deleteMutation.mutate(id);
    }
    
    const deleteLotto = (lotto) => {
        deleteLottoMutation.mutate(lotto);
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
                                Scarichi
                                {searchParams.get("id_prodotto") && "*"}
                                {searchParams.get("id_colore_esterno") && "*"}
                                {searchParams.get("id_colore_interno") && "*"}
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
                                onClick={() => changeSort("quantita_scaricata")}
                                role="button"
                            >
                                {searchParams.get("sort_by") === "quantita_scaricata" && 
                                    (searchParams.get("sort_order") === "desc" ?
                                        "↓ " : "↑ ")
                                }
                                Quantità scaricata
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
                                                    {lotto.quantita_scaricata || 0} Pz
                                                </td>
                                                <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    {isAdmin() && (
                                                        <button 
                                                            className="btn btn-sm btn-light"
                                                            onClick={() => deleteLotto(lotto.lotto)}
                                                        >
                                                            <img width="20" src={Trash} alt="trash"/>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {lotto.scarichi.map((scarico, index) => (
                                                <tr key={index} className={`table-row ${expanded.includes(lotto.lotto) ? "" : "d-none"}`}>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {scarico.id_prodotto}*{scarico.id_colore_esterno}{scarico.id_colore_interno}*
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {scarico.quantita || 0} Pz
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        {scarico.quantita_scaricata || 0} Pz
                                                    </td>
                                                    <td className={`table-data ${index % 2 ? "table-data-odd" : ""}`}>
                                                        <div className="d-flex justify-content-center align-items-center gap-1">
                                                            {scarico.quantita > scarico.quantita_scaricata && (
                                                                <button 
                                                                    className="btn btn-sm btn-light"
                                                                    onClick={() => checkScarico(scarico)}
                                                                >
                                                                    <img width="20" src={Check} alt="check"/>
                                                                </button>
                                                            )}
                                                            {isAdmin() && (
                                                                <>
                                                                    <ModificaElencoQr elencoQr={scarico}/>
                                                                    <button 
                                                                        className="btn btn-sm btn-light"
                                                                        onClick={() => deleteScarico(scarico.id)}
                                                                    >
                                                                        <img width="20" src={Trash} alt="trash"/>
                                                                    </button>
                                                                </>
                                                            )}
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
                    <Link style={{textDecoration: "none"}} to="/magazzino/qr/elenco/aggiungi">
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
                                <div>
                                    <label htmlFor="id_prodotto">Id prodotto</label>
                                    <input
                                        type="text" 
                                        placeholder="id prodotto" 
                                        name="id_prodotto"
                                        id="id_prodotto"
                                        className="form-control"
                                        onChange={onFilterChange}
                                        value={filters.id_prodotto}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="id_colore_esterno">Id colore esterno</label>
                                    <input
                                        type="text" 
                                        placeholder="id colore esterno" 
                                        name="id_colore_esterno"
                                        id="id_colore_esterno"
                                        className="form-control"
                                        onChange={onFilterChange}
                                        value={filters.id_colore_esterno}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="id_colore_interno">Id colore interno</label>
                                    <input
                                        type="text" 
                                        placeholder="id colore interno" 
                                        name="id_colore_interno"
                                        id="id_colore_interno"
                                        className="form-control"
                                        onChange={onFilterChange}
                                        value={filters.id_colore_interno}
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

export default ListaQr;
