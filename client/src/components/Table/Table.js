import React, { useState } from "react";
import "./Table.css"
import 'bootstrap-icons/font/bootstrap-icons.css';

const Table = ({titles, data}) => {
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (rowIndex) => {
        setExpandedRows((prev) => ({
            ...prev,
            [rowIndex]: !prev[rowIndex],
        }));
    };

    const renderTable = () => {
        return (
            <>
                {data.map((row, colIndex) => {
                    const subTables = Object.values(row).filter(
                        (value) => Array.isArray(value)
                    );
                    const isExpanded = expandedRows[colIndex];

                    return (
                        <React.Fragment key={colIndex}>
                            <tr className="table-row">
                                {Object.values(row).map((value, index) => {
                                    if (!Array.isArray(value)) {
                                        return (
                                            <td
                                                className={`table-data ${colIndex % 2 ? "table-data-odd" : ""}`}
                                                key={index}
                                            >
                                                {value}
                                            </td>
                                        );
                                    } else {
                                        return (
                                            <td
                                                className={`table-data ${colIndex % 2 ? "table-data-odd" : ""}`}
                                                key={index}
                                            >
                                                <button 
                                                    className="btn btn-sm"
                                                    onClick={() => toggleRow(colIndex)}
                                                >
                                                    <i className={`bi ${isExpanded ? "bi-caret-down-fill" : "bi-caret-up-fill"}`}></i>
                                                </button>
                                            </td>
                                        );
                                    }
                                })}
                            </tr>

                            {isExpanded > 0 && subTables.map((value, index) => {
                                return (
                                    value.map((row, index) => (
                                        <tr className="table-row" key={index}>
                                            {Object.values(row).map((cell, i) => (
                                                <td 
                                                    className={`table-data ${colIndex % 2 ? "table-data-odd" : ""}`}
                                                    key={i}

                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )
                                return (
                                    <tr 
                                        className="table-row" 
                                        key={index}
                                    >
                                        {value.map((value, index) => {
                                            return (
                                                <td className="table-data" key={index}>{value}</td>
                                            )
                                        })}
                                    </tr>
                                )
                            })}
                        </React.Fragment>
                    );
                })}

            </>
        )

    }
    //if(!data || data.length === 0) {
    //    return (<div>Non è presente alcuna tupla corrispondente alla ricerca</div>)
    //}
    //
    return (
        <table className="w-100">
            <thead>
                <tr
                    className="table-row"
                >
                    {titles.map((title, index) => 
                        <th
                            className="table-header"
                            key={index}
                        >
                            {title}
                        </th>
                    )}
                </tr>
            </thead>
            <tbody>
                {renderTable()}
            </tbody>
        </table>
    );
}

export default Table;
