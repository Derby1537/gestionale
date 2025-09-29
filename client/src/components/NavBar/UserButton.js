import React from "react";
import { useUser } from "../../contexts/UserContext";
import './Navbar.css';
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";

const UserButton = () => {
    const { user } = useUser();
    return (
        <Link
            to={user ? "/profilo" : "/login"} 
            className="user-button d-none d-lg-flex justify-content-end justify-content-lg-center align-items-lg-center" 
        >
            <Button variant="light" className="d-flex align-items-center ">
                {user ? user.username : 'Login'}
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    fill="currentColor" 
                    className="bi bi-person-badge" 
                    viewBox="0 0 16 16"
                >
                    <path d="M6.5 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                    <path d="M4.5 0A2.5 2.5 0 0 0 2 2.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2.5A2.5 2.5 0 0 0 11.5 0zM3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v10.795a4.2 4.2 0 0 0-.776-.492C11.392 12.387 10.063 12 8 12s-3.392.387-4.224.803a4.2 4.2 0 0 0-.776.492z"/>
                </svg>
            </Button>
        </Link>
    )
}

export default UserButton;
