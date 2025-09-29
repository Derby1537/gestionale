import React from "react";
import './homepage.css'
import logoMagazzino from '../assets/ware-house.png';
import logoOrdini from '../assets/clipboard.png';
import logoSupporto from '../assets/person-circle.svg';
import Link from "../components/homepage/Link";

const HomePage = () => {
    return (
        <div className="homepage">
            <div id="logo-homepage"></div>
            
            <Link
                title="Magazzino"
                url="/magazzino" 
                logo={logoMagazzino}
            />

            <Link
                title="Ordini"
                url="/ordini" 
                logo={logoOrdini}
            />

            <div className="position-absolute bottom-0 end-0">
                <Link
                    title="Supporto"
                    url="/supporto" 
                    logo={logoSupporto}
                />
            </div>
        </div>
    );
}

export default HomePage;

