
import React, { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react"
import { useUser } from "../../contexts/UserContext";

const Qr = () => {
    const [formData, setFormData] = useState({
        id_articolo: "",
        colore_esterno: "",
        colore_interno: "",
        quantita: 1,
        lotto: "",
        info: ""
    })
    const [qrUrl, setQrUrl] = useState("");
    const qrRef = useRef(null);
    const { isAdmin, checkAuth } = useUser();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const [error, setError] = useState("");
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const params = new URLSearchParams({
                addNew: "1",
                id: formData.id_articolo,
                ce: formData.colore_esterno,
                ci: formData.colore_interno,
                qnt: formData.quantita,
                lt: formData.lotto,
                inf: formData.info
            });

            const baseUrl = window.location.origin + "/magazzino/scarichi";
            const fullUrl = `${baseUrl}?${params.toString()}`;

            setQrUrl(fullUrl);

            setTimeout(() => {
            const canvas = qrRef.current?.querySelector("canvas");
            if (canvas) {
                const pngUrl = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = 
                        formData.id_articolo + "-" + 
                        formData.colore_esterno + "-" + 
                        formData.colore_interno + "-" +
                        formData.lotto + "-" +
                        "qr-code.png";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        }, 0);
        }
        catch (error) {
            console.error(error);
            setError("Errore interno");
        }
    }

    useEffect(() => {
        checkAuth();
    }, [])

    if (!isAdmin()) {
        return (<>Non sei autenticato</>);
    }

    return (
        <div className="homepage justify-content-center align-items-center align-content-center">
            <div id="logo-homepage"></div>
            <div className="container">
                <div className="d-none" ref={qrRef}>{qrUrl && <QRCodeCanvas value={qrUrl} size={256}/>}</div>
                <div className="row d-flex justify-content-center">
                    <div className="col-12 col-lg-6">
                        <form 
                            className="w-100 bg-white-transparent p-4 rounded shadow-lg"
                            onSubmit={handleSubmit}
                        >
                            <h2>Genera QR Code per scarico</h2>
                            <br/>

                            <label htmlFor="id_articolo">Id articolo</label><br/>
                            <input 
                                type="text" 
                                placeholder="id articolo" 
                                name="id_articolo"
                                id="id_articolo"
                                className="form-control"
                                value={formData.id_articolo}
                                onChange={handleChange}
                            />
                            <br/>

                            <label htmlFor="colore_esterno">Colore esterno</label><br/>
                            <input 
                                type="text" 
                                placeholder="id colore esterno" 
                                name="colore_esterno"
                                id="colore_esterno"
                                className="form-control"
                                value={formData.colore_esterno}
                                onChange={handleChange}
                            />
                            <br/>

                            <label htmlFor="colore_interno">Colore interno (lasciare vuoto per inserire un accessorio)</label><br/>
                            <input 
                                type="text" 
                                placeholder="id colore interno" 
                                name="colore_interno"
                                id="colore_interno"
                                className="form-control"
                                value={formData.colore_interno}
                                onChange={handleChange}
                            />
                            <br/>

                            <label htmlFor="quantita">Quantità scaricata (Pz)</label><br/>
                            <input 
                                type="number" 
                                min="1"
                                step="1"
                                placeholder="quantita" 
                                name="quantita"
                                id="quantita"
                                className="form-control"
                                value={formData.quantita}
                                onChange={handleChange}
                            />
                            <br/>

                            <label htmlFor="Lotto">Lotto</label><br/>
                            <input 
                                type="text" 
                                placeholder="lotto" 
                                name="lotto"
                                id="lotto"
                                className="form-control"
                                value={formData.lotto}
                                onChange={handleChange}
                            />
                            <br/>

                            <label htmlFor="info">Info aggiuntive</label><br/>
                            <input 
                                type="text" 
                                placeholder="info" 
                                name="info"
                                id="info"
                                className="form-control"
                                value={formData.info}
                                onChange={handleChange}
                            />
                            <br/>

                            <div 
                                id="error"
                                className="text-danger"
                            >
                                {error}
                            </div>

                            <div className="d-flex justify-content-end">
                                <input 
                                    type="submit" 
                                    value="Genera QR Code"
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

export default Qr;

