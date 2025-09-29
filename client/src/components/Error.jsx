const Error = ({ error }) => {
    let errorMessage = "";
    switch (error.response.status) {
        case 401:
            errorMessage = "Non sei autenticato";
            break;
        case 403:
            errorMessage = "Non hai i permessi";
            break;
        case 404:
            errorMessage = "Risorsa non trovata"
            break;
        case 500:
            errorMessage = "Errore interno"
            break;
    }
    return (
        <div className="text-danger">
            {errorMessage} 
        </div>
    )
}

export default Error;
