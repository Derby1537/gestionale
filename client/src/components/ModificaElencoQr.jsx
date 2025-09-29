import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putElencoQrApi } from "../api/elencoQr";

const ModificaElencoQr = ({ elencoQr }) => {
    const [show, setShow] = useState(false);
    const [formData, setFormData] = useState({ ...elencoQr });
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (formData) => {
            return putElencoQrApi(formData);
        },
        onSuccess: () => {
            alert("Elemento elenco QR modificato con successo");
            queryClient.invalidateQueries({ queryKey: ["elenco_qr"] });
        },
        onError: (e) => {
            console.error(e);
        }
    })

    const handleClose = () => {
        setShow(false);
    }

    const onKeyDown = (e) => {
        e.stopPropagation();
        console.log(e.key);
        if (e.key === "Enter") {
            onSubmit();
        }
    }

    const onChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))
    }

    const onSubmit = (e) => {
        e?.preventDefault();
        console.log(formData);
        mutation.mutate({ ...formData });
    }

    return (
        <>
            <Button variant="light" size="sm" onClick={() => { console.log(elencoQr); setShow(true) }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                </svg>
            </Button>
            <Modal 
                onKeyDown={onKeyDown} 
                show={show} 
                onHide={handleClose} 
                centered 
            >
                <Modal.Header closeButton>
                    <Modal.Title>Modifica elemento elenco QR</Modal.Title>
                </Modal.Header>
                <form
                    onSubmit={onSubmit}
                >
                    <Modal.Body
                        className="d-flex flex-column gap-3"
                    >
                        <div>
                            <label htmlFor="lotto">Lotto</label>
                            <input
                                type="number" 
                                placeholder="lotto" 
                                name="lotto"
                                id="lotto"
                                required
                                className="form-control"
                                onChange={onChange}
                                value={formData.lotto}
                            />
                        </div>
                        <div>
                            <label htmlFor="id_prodotto">Id prodotto</label>
                            <input
                                type="text" 
                                placeholder="id prodotto" 
                                name="id_prodotto"
                                id="id_prodotto"
                                required
                                className="form-control"
                                onChange={onChange}
                                value={formData.id_prodotto}
                            />
                        </div>
                        <div>
                            <label htmlFor="id_colore_esterno">Id colore esterno</label>
                            <input
                                type="text" 
                                placeholder="id colore esterno" 
                                name="id_colore_esterno"
                                id="id_colore_esterno"
                                required
                                className="form-control"
                                onChange={onChange}
                                value={formData.id_colore_esterno}
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
                                onChange={onChange}
                                value={formData.id_colore_interno}
                            />
                        </div>
                        <div>
                            <label htmlFor="quantita">Quantita</label>
                            <input
                                type="number" 
                                min={0}
                                placeholder="quantita" 
                                name="quantita"
                                id="quantita"
                                className="form-control"
                                onChange={onChange}
                                value={formData.quantita}
                            />
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Chiudi
                        </Button>
                        <Button variant="primary" onClick={onSubmit}>
                            Modifica
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </>
    )
}

export default ModificaElencoQr
