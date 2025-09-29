import React, { forwardRef, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

const BottoneAggiungi = forwardRef(({children, onApplyInsert, onOpenModal, onCloseModal}, ref) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    const handleEnter = async () => {
        if(onApplyInsert) {
            if(await onApplyInsert()) {
                handleClose();
                onCloseModal();
                setTimeout(() => {navigate(location.pathname)}, 300);
            }
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
            <button ref={ref} className="btn btn-primary flex-shrink-0 d-none d-lg-block mx-1" onClick={handleClick}>
                + Aggiungi
            </button>
            <button className="btn btn-primary flex-shrink-0 d-block d-lg-none" onClick={handleClick}>
                + 
            </button>
            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Aggiungi</Modal.Title>
                </Modal.Header>
                <Modal.Body onKeyDown={handleKeyDown}>
                    {children}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={handleEnter} onKeyDown={handleKeyDown}>
                        Inserisci
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
});

export default BottoneAggiungi;
