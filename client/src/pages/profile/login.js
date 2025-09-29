import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const { login, checkAuth, user } = useUser();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    })

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
            const success = await login(formData.username, formData.password)

            if(success) {
                navigate("/");
                setTimeout(() => {
                    navigate("/"); 
                }, 100);
            }
            else {
                setError("Credenziali errate");
            }
        }
        catch (error) {
            console.error("Errore di login: ", error);
            setError("Errore interno");
        }
    }

    useEffect(() => {
        const checkLogin = async () => {
            await checkAuth();
            if (user) {
                navigate("/profilo");
            }
        }
        checkLogin();
    }, [user])

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
                            <h2>Effettua il login</h2>
                            <br/>

                            <label htmlFor="username">Username</label><br/>
                            <input 
                                type="text" 
                                placeholder="username" 
                                name="username"
                                id="username"
                                className="form-control"
                                value={formData.username}
                                onChange={handleChange}
                            />
                            <br/>

                            <label htmlFor="password">Password</label><br/>
                            <input 
                                type="password" 
                                placeholder="password" 
                                name="password"
                                id="password"
                                className="form-control"
                                value={formData.password}
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
                                    value="Login"
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

export default LoginPage;

