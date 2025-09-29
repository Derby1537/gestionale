import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { putVetroApi } from "../../../api/ordini/vetri";

const formatDate = (date) => {
    if (!date) return "";
    const formattedDate = new Date(date).toLocaleDateString("it-IT").split("/");

    return `${formattedDate[2]}-${formattedDate[1]}-${formattedDate[0]}`
}

const ModificaOrdineVetro = ({ vetro }) => {
    const [show, setShow] = useState(false);
    const [formData, setFormData] = useState({
        ...vetro,
        data_consegna: formatDate(vetro.data_consegna)
    });
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: (formData) => {
            return putVetroApi(formData);
        },
        onSuccess: () => {
            alert("Ordine vetro modificato con successo");
            queryClient.invalidateQueries({ queryKey: ["vetri"] });
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
        const { name, type, value, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const onSubmit = (e) => {
        e?.preventDefault();
        mutation.mutate({ ...formData });
    }

    return (
        <>
            <Button variant="light" size="sm" onClick={() => setShow(true)}>
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
                    <Modal.Title>Modifica ordine del vetro</Modal.Title>
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
                            <label htmlFor="riferimento">Riferimento</label>
                            <input
                                type="text" 
                                placeholder="riferimento" 
                                name="riferimento"
                                id="riferimento"
                                required
                                className="form-control"
                                onChange={onChange}
                                value={formData.riferimento}
                            />
                        </div>


                        <div>
                            <label htmlFor="numero_vetri">Quantità ordinata (Pz)</label>
                            <input
                                type="number" 
                                min={1}
                                placeholder="numero_vetri" 
                                name="numero_vetri"
                                id="numero_vetri"
                                required
                                className="form-control"
                                onChange={onChange}
                                value={formData.numero_vetri}
                            />
                        </div>
                        <div>
                            <label htmlFor="data_consegna">Data consegna</label>
                            <input
                                type="date" 
                                placeholder="data consegna" 
                                name="data_consegna"
                                id="data_consegna"
                                required
                                className="form-control"
                                onChange={onChange}
                                value={formData.data_consegna}
                            />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <input
                                type="checkbox" 
                                name="consegnato"
                                id="consegnato"
                                onChange={onChange}
                                checked={formData.consegnato}
                            />
                            <label htmlFor="consegnato">Consegnato</label>
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

export default ModificaOrdineVetro
