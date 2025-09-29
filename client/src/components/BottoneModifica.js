import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const BottoneModifica = ({row, sampleForm, onOpenModal, onCloseModal, credentialsNeeded, disabledFields, customLink }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [edit, setEdit] = useState({
        errore_id_prodotto: "Errore",
    })

    const onChange = (e) => {
        const { name, type, checked, value } = e.target;
        setEdit((prevFilters) => ({
            ...prevFilters,
            [name]: type === "checkbox" ? checked : value,
        }))
    }

    useEffect(() => {
        if(showModal && row) {
            setEdit(row);
        }
    }, [showModal, row])

    if(credentialsNeeded && !isAdmin()) {
        return (<div></div>);
    }

    const applyEdit = async () => {
        try {
            const link = customLink || `/api${location.pathname}/${row.id}`
            const response = await fetch(link, {
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
            if (error.message.startsWith("Devi eliminare tutti")) {
                alert(error.message);
            }
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

    const renderForm = () => {
        if(!sampleForm) return null;

        const formElement = typeof sampleForm === "function" ? sampleForm() : sampleForm;

        return (
            <div>
                {React.Children.map(formElement.props.children, (child) => {
                    if(child.type === "textarea") {
                        return (
                            <textarea
                                {...child.props}
                                value={edit[child.props.name] || ""}
                                onChange={onChange}
                            >
                                {edit[child.props.name] || ""}
                            </textarea>
                        )
                    }
                    else if(child.type === "input" || child.type === "textarea") {
                        if(child.props.type === "date") {
                            try {
                                const date = new Date(edit[child.props.name]).toLocaleDateString("it-IT").split("/");
                                const formattedDate = date[2] + "-" + date[1] + "-" + date[0];
                                return (
                                    <input
                                        {...child.props}
                                        value={formattedDate || ""}
                                        onChange={onChange}
                                    />
                                )
                            }
                            catch (e) {}

                        }
                        else if(child.props.type === "checkbox") {
                            return (
                                <input 
                                    {...child.props}
                                    checked={edit["consegnato"] || edit["pellicolato"] || edit["ok_prod"]}
                                    type="checkbox"
                                    onChange={onChange}
                                />
                            )
                        }
                        return (
                            <input
                                {...child.props}
                                value={edit[child.props.name] || ""}
                                onChange={onChange}
                                disabled={disabledFields?.includes(child.props.name)}
                            />
                        )
                    }
                    else if(child.type === "label") {
                        return (
                            <label
                                htmlFor={child.props.htmlFor}
                                className={child.props.classname}
                            >
                                {child.props.children}
                            </label>
                        )
                    }
                    else if(child.type === "div") {
                        return (
                            <div className="text-danger">
                                {edit[child.props.id] || ""}
                            </div>
                        )
                    }
                    else if(child.type === "br") {
                        return (<br/>)
                    }
                })}
            </div>
        )
    }
    
    return (
        <div>
            <Button variant="light" size="sm" onClick={handleClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-fill" viewBox="0 0 16 16">
                    <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z"/>
                </svg>
            </Button>
            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Modifica</Modal.Title>
                </Modal.Header>
                <Modal.Body onKeyDown={handleKeyDown}>
                    {renderForm()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={handleEnter} onKeyDown={handleKeyDown}>
                        Modifica
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default BottoneModifica;
