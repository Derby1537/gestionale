import React, { useState } from "react";
import "./Navbar.css";
import { useLocation, useNavigate } from "react-router-dom";

const Searchbar = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const [searchTerm, setSearchTerm] = useState(queryParams.get("q") || "");
    const navigate = useNavigate();

    // Search function
    const handleSearch = () => {
            const searchParams = new URLSearchParams(location.search);
            searchParams.set('q', searchTerm);
            searchParams.set('page', 1);
            navigate({
                pathname: location.pathname,
                search: searchParams.toString(),
            })
    };

    // Handle input change
    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Handle Enter key press
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <ul className="navbar-nav me-auto w-100 w-lg-75 mb-2 mb-lg-0 ps-lg-4 pe-lg-4 position-relative">
            <input
                id="search-input"
                className="form-control w-100 w-lg-75 text-center"
                placeholder="Cerca"
                aria-label="Cerca"
                value={searchTerm}
                onChange={handleInputChange}  
                onKeyDown={handleKeyDown}  
            />
            <div 
                id="search-button" 
                role="button" 
                className="position-absolute p-lg-4 searchbar-button"
                onClick={handleSearch}  
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
                </svg>
            </div>
        </ul>
    );
};

export default Searchbar;

