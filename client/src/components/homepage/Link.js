import React from "react";
import { Link } from "react-router-dom";

const link = ({ title, url, logo }) => {
    return (
        <Link to={url}>
            <div 
                className="logo"
                style={{ backgroundImage: `url(${logo})` }}>

            </div>
            {title}
        </Link>
    );
}

export default link;
