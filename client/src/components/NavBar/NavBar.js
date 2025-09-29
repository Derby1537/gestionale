import React, { useRef } from "react";
import './Navbar.css'
import MobileMenuItem from './MobileMenuItem'
import Searchbar from './Searchbar'
import UserButton from './UserButton'
import { Link } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";

const NavBar = () => {
    const { user } = useUser();
    
    const toggleButtonRef = useRef(null);

    const toggleMenu = () => {
        if (toggleButtonRef.current) {
            toggleButtonRef.current.click();
        }
    }

    return (
        <nav className="navbar navbar-expand-lg">
            <div className="container-fluid">
                <button 
                    ref={toggleButtonRef}
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarToggler" 
                    aria-controls="navbarToggler" 
                    aria-label="Apri menù"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <Link className="navbar-brand" to="/">
                    <img src="/img/logo.png" height="55" alt="Logo"/>
                </Link>
                <div className={`navbar-collapse collapse`} id="navbarToggler">
                    <ul className="navbar-nav me-auto mb-2 mb-ls-0 d-lg-none">
                        <MobileMenuItem 
                            title="Magazzino"
                            url="/magazzino"
                            onClick={toggleMenu}
                        />
                        <MobileMenuItem 
                            title="Ordini"
                            url="/ordini"
                            onClick={toggleMenu}
                        />
                        <MobileMenuItem 
                            title="Supporto"
                            url="/supporto"
                            onClick={toggleMenu}
                        />
                        <MobileMenuItem 
                            title={user ? "Profilo" : 'Login'}
                            url={user ? "/profilo" : "/login"}
                            onClick={toggleMenu}
                        />
                        <Searchbar/>
                    </ul>
                </div>
                <div className="w-100 d-none d-lg-block">
                    <Searchbar/>

                </div>
                <UserButton/>
            </div>
        </nav>
    )
}

export default NavBar;

