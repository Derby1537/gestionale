import React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const MobileMenuItem = ({ title, url, onClick }) => {
    const location = useLocation();
    return (
        <li className={`nav-item ${location.pathname === url ? "active" : ""}`}>
            <Link 
                onClick={onClick}
                className="nav-link" 
                to={url}
            >
                {title}
            </Link>
        </li>
    )
}

export default MobileMenuItem;
