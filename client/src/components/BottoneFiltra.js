import React, { forwardRef, useState } from "react";
import { Modal, Button } from "react-bootstrap";

const BottoneFiltra = forwardRef(({ children, onApplyFilters, onOpenModal, onCloseModal }, ref) => {
    const [showModal, setShowModal] = useState(false);

    const handleEnter = () => {
        setShowModal(false);
        onCloseModal();

        if(onApplyFilters) {
            onApplyFilters();
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
            <div onClick={handleClick}>
                <button ref={ref} className="btn btn-primary flex-shrink-0 d-none d-lg-block mx-1">
                    <svg role="button" id="colore-esterno-filter" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/></svg>
                    Filtra
                </button>
                <button className="btn btn-primary flex-shrink-0 d-block d-lg-none">
                    <svg role="button" id="colore-esterno-filter" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5z"/></svg>
                </button>
            </div>
            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Filtra</Modal.Title>
                </Modal.Header>
                <Modal.Body onKeyDown={handleKeyDown}>
                    {children}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={handleEnter} onKeyDown={handleKeyDown}>
                        Applica Filtri
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
});

export default BottoneFiltra;
