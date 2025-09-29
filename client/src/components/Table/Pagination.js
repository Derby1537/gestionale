import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Pagination = ({currentPage, totalPages, setCurrentPage}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handlePageChange = (page) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('page', page);
        navigate({
            pathname: location.pathname,
            search: searchParams.toString(),
        });
        setCurrentPage(page)
    };

    const prevPage = (page) => {
        if(page === 1) {
            return 1;
        }
        return page-1;
    }
    const nextPage = (page) => {
        if(page === totalPages) {
            return totalPages;
        }
        return page+1;
    }

    return (
        <div className="pagination">
            <button onClick={() => handlePageChange(1)} disabled={currentPage <= 1} >
                Inizio
            </button>
            <button onClick={() => handlePageChange(prevPage(currentPage))} hidden={currentPage <= 1}>
                {currentPage - 1}
            </button>
            <button className="bg-primary">
                {currentPage}
            </button>
            <button onClick={() => handlePageChange(nextPage(currentPage))} hidden={currentPage >= totalPages}>
                {currentPage + 1}
            </button>
            <button onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages}>
                Fine
            </button>
        </div>
    )
}

export default Pagination;
