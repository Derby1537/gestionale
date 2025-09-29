import React, { useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
    const { user, logout, checkAuth } = useUser();
    const navigate = useNavigate();

    const logoutFromProfile = () => {
        logout()
        navigate("/");
    }

    useEffect(() => {
        const checkLogin = async () => {
            await checkAuth();
            if (!user) {
                navigate("/login");
            }
        }
        checkLogin();
    }, [user])

    if (!user) {
        return <></>
    };

    return (
        <div className="homepage justify-content-center align-items-center align-content-center">
            <div id="logo-homepage"></div>
            <div className="container">
                <div className="row d-flex justify-content-center">
                    <div className="col-12 col-lg-6">
                        <div className="w-100 bg-white-transparent p-4 rounded shadow-lg">
                            <h2>Bentornato {user.username}</h2>
                            <br/>
                            <div className="d-flex justify-content-end">
                                <button 
                                    className="btn btn-danger"
                                    onClick={logoutFromProfile}
                                >
                                    logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default ProfilePage;

