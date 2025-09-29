
import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const BottoneAggiungiOrdine = ({ row, onOpenModal, onCloseModal, credentialsNeeded }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [edit, setEdit] = useState({
        lotto_infissi: row.lotto_infissi || "",
        errore_lotto_infissi: "",
        lotto_cassonetti: row.lotto_cassonetti || "",
        errore_lotto_cassonetti: "",
    })

    useEffect(() => {
        setEdit((prev) => ({
            ...prev,
            lotto_infissi: row.lotto_infissi || "",
            lotto_cassonetti: row.lotto_cassonetti || ""
        }));
    }, [row.lotto_infissi, row.lotto_cassonetti]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setEdit((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }))
    }

    if(credentialsNeeded && !isAdmin()) {
        return (<div></div>);
    }

    const applyEdit = async () => {
        try {
            const response = await fetch(`/api/ordini/lotti/${encodeURIComponent(row.id)}`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(edit),
                credentials: "include"
            })

            if(!response.ok) {
                const errorResponse = await response.json();
                throw errorResponse;
            }

            const data = await response.json();
            alert(data.message);

            return true;
        }
        catch (error) {
            const keys = Object.keys(edit);
            for(let i = 0; i < keys.length; i++) {
                if(keys[i].startsWith("errore"))  {
                    setEdit((prevFilters) => ({
                        ...prevFilters,
                        [keys[i]]: "",
                    }))
                }
            }
            setEdit((prevFilters) => ({
                ...prevFilters,
                [error.field]: error.message,
            }))
            return false;
        }

    }

    const handleEnter = async () => {
        if(await applyEdit()) {
            setShowModal(false);
            onCloseModal();
            setTimeout(() => {navigate(location.pathname + '?refresh=' + new Date().getTime())}, 300);
        }
    };

    const handleKeyDown = (event) => {
        if(showModal === true) {
            if (event.key === "Enter") {
                handleEnter();
            }
        }
    };

    const handleClick = () => {
        setShowModal(true);
        onOpenModal();
    }

    const handleClose = () => {
        setShowModal(false);
        onCloseModal();
    }

    return (
        <div>
            <Button variant="light" size="sm" onClick={handleClick}>
                +
            </Button>
            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Aggiungi lotti all'ordine {row.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body onKeyDown={handleKeyDown}>
                        <label htmlFor="lotto_infissi">Lotto infissi</label><br/>
                        <input 
                            type="number" 
                            placeholder="lotto infissi" 
                            name="lotto_infissi"
                            id="lotto_infissi"
                            className="form-control"
                            onChange={onChange}
                            value={edit.lotto_infissi}
                        />
                        <div className="text-danger" id="errore_lotto_infissi">{edit.errore_lotto_infissi}</div>
                        <br/>

                        <label htmlFor="lotto_cassonetti">Lotto cassonetti</label><br/>
                        <input 
                            type="number" 
                            placeholder="lotto cassonetti" 
                            name="lotto_cassonetti"
                            id="lotto_cassonetti"
                            className="form-control"
                            onChange={onChange}
                            value={edit.lotto_cassonetti}
                        />
                        <div className="text-danger" id="errore_lotto_cassonetti">{edit.errore_lotto_cassonetti}</div>
                        <br/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={handleEnter} onKeyDown={handleKeyDown}>
                        Aggiungi
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default BottoneAggiungiOrdine;
