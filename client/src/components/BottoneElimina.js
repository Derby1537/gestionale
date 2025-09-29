import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext"; 

const BottoneElimina = ({row, sampleForm, onOpenModal, onCloseModal}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin } = useUser();
    const [showModal, setShowModal] = useState(false);
    const [edit, setEdit] = useState({
    })


    const onChange = (e) => {
        const { name, value } = e.target;
        setEdit((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }))
    }

    useEffect(() => {
        if(showModal && row) {
            setEdit(row);
        }
    }, [showModal, row])

    if(!isAdmin()) {
        return (<div></div>);
    }

    const applyEdit = async () => {
        try {
            const response = await fetch(`/api${location.pathname}/elimina/${row.id}`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(edit),
                credentials: "include",
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
            if(error.message) {
                alert(error.message);

            }
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
                                disabled
                            >
                                {edit[child.props.name] || ""}
                            </textarea>
                        )
                    }
                    else if(child.type === "input" || child.type === "textarea") {
                        return (
                            <input
                                {...child.props}
                                value={edit[child.props.name] || ""}
                                onChange={onChange}
                                disabled
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0"/>
                </svg>

            </Button>
            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Elimina</Modal.Title>
                </Modal.Header>
                <Modal.Body onKeyDown={handleKeyDown}>
                    {renderForm()}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Chiudi
                    </Button>
                    <Button variant="primary" onClick={handleEnter} onKeyDown={handleKeyDown}>
                        Elimina
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default BottoneElimina;
