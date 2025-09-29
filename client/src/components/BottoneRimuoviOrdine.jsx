import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const BottoneRimuoviOrdine = ({lotto, ordine, onOpenModal, onCloseModal, credentialsNeeded }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin } = useUser();
    const [showModal, setShowModal] = useState(false);

    if(credentialsNeeded && !isAdmin()) {
        return (<div></div>);
    }

    const applyEdit = async () => {
        try {
            const body = {
                numero_lotto: lotto.id,
                riferimento: ordine.numero_ordine
            }
            const response = await fetch(`/api/ordini/lotti/ordini/elimina/${lotto.id}`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
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
                x
            </Button>
            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Rimuovi ordine dal lotto {lotto.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body onKeyDown={handleKeyDown}>
                        <label htmlFor="riferimento">Riferimento</label><br/>
                        <input 
                            disabled={true}
                            type="text" 
                            placeholder="riferimento" 
                            name="riferimento"
                            id="riferimento"
                            className="form-control"
                            value={ordine.numero_ordine}
                        />
                        <br/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={handleEnter} onKeyDown={handleKeyDown}>
                        Rimuovi
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default BottoneRimuoviOrdine;
