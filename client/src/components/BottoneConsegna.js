import React from "react";
import { Button } from "react-bootstrap";
import { useUser } from "../contexts/UserContext"; 
import { useLocation, useNavigate } from "react-router-dom";

const BottoneConsegna = ({ row }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAdmin } = useUser();

    if(!isAdmin()) {
        return (<div></div>);
    }

    const applyDeliver = async () => {
        try {
            const response = await fetch(`/api${location.pathname}/consegna/${row.id}`, {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(row),
                credentials: "include",
            })

            if(!response.ok) {
                const errorResponse = await response.json();
                throw errorResponse;
            }

            const data = await response.json();
            alert(data.message);

            return true;
        }
        catch (error) {
            alert(error.message);
        }

    }

    const handleClick = () => {
        if(applyDeliver()) {
            const params = new URLSearchParams(location.search);
            navigate({
                pathname: location.pathname,
                search: params.toString() + '&refresh=' + new Date().getTime(),
            })

        }
    }



    return (
        <div>
            <Button variant="light" size="sm" onClick={handleClick}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-seam-fill" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003zM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461z"/>
                </svg>
            </Button>
        </div>
    )
}

export default BottoneConsegna;
