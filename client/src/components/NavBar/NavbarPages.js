import React, { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";

const NavbarPages = ({ pages }) => {
    const { isAdmin } = useUser();
    const location = useLocation();
    const pathname = location.pathname;
    const activeRef = useRef(null);

    useEffect(() => {
        if (!activeRef.current) return;
        
        pages.forEach(page => {
            if (page.path === "/ordini" && pathname === "/ordini/aggiungi") {
            } 
        });
        activeRef.current.scrollIntoView({
            inline: "center",
            behavior: "smooth",
        });
    }, [pathname]);

    return (
        <nav className="navbar-pagine">
            {pages.map(({ title, path, adminOnly, hide }) => (
                <NavLink
                    key={path}
                    to={path}
                    ref={pathname === path ? activeRef : null}
                    className={({ isActive }) => {
                        if (hide) {
                            return "d-none"
                        }
                        if (adminOnly && !isAdmin()) {
                            return "d-none";
                        }

                        if (!isActive) return;

                        if (path !== pathname) {
                            if (path + "/aggiungi" === pathname) {
                                return "active";
                            }
                            return;
                        }
                        if (isActive) {
                            return "active"
                        }
                    }}
                >
                    {title}
                </NavLink>
            ))}
        </nav>
    );
};

export default NavbarPages;

