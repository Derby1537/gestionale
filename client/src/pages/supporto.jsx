import React, { useState } from "react";

const SupportoPage = () => {
    const [formData, setFormData] = useState({
        descrizione: "",
        errore_descrizione: ""
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/supporto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
                credentials: "include",
            })

            if (!response.ok) {
                if (response.status === 400) {
                    const data = await response.json();
                    setFormData((prev) => ({
                        ...prev,
                        errore_descrizione: data.message
                    }))
                    return;
                }
                throw Error(response);
            }
            const data = await response.json();

            setFormData((prev) => ({
                ...prev,
                errore_descrizione: ""
            }))
            alert(data.message);
        }
        catch (error) {
            console.error(error);
            alert("Internal server error");
        }
    }

    return (
        <div className="homepage justify-content-center align-items-center align-content-center">
            <div id="logo-homepage"></div>
            <div className="container">
                <div className="row d-flex justify-content-center">
                    <div className="col-12 col-lg-6">
                        <form 
                            className="w-100 bg-white-transparent p-4 rounded shadow-lg"
                            onSubmit={handleSubmit}
                        >
                            <h2>Segnala materiale mancante o errato</h2>
                            <br/>

                            <label htmlFor="descrizione">Descrizione</label><br/>
                            <textarea
                                placeholder="scrivi qui" 
                                name="descrizione"
                                id="descrizione"
                                className="form-control mt-1"
                                value={formData.descrizione}
                                onChange={handleChange}
                                style={{resize: "none"}}
                            ></textarea>
                            <br/>
                            <div className="text-danger">{formData.errore_descrizione}</div>

                            <div className="d-flex justify-content-end">
                                <input 
                                    type="submit" 
                                    value="Invio"
                                    className="btn btn-primary"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SupportoPage;
