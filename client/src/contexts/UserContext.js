import React, { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const checkAuth = async() => {
        try {
            const response = await fetch('/api/me', { credentials: "include" });
            if(!response.ok) throw new Error("Not logged in") ;

            const data = await response.json();
            setUser(data);
        }
        catch (error) {
            setUser(null);
        }
    }
    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
                credentials: "include",
            })

            if(!response.ok) throw new Error("Login failed");

            const data = await response.json()
            setUser(data);
            return true;
        }
        catch (error) {
            console.error("Login error: ", error);
            return false;
        }
    }

    const logout = async () => {
        try {
            await fetch("/api/logout", { method: "POST", credentials: "include" })
            setUser(null);
        }
        catch (error) {
            console.error("Logout failed", error);
        }
    }

    const isAdmin = () => {
        if(user) {
            return user.role === "admin";
        }
        return false;
    }

    return (
        <UserContext.Provider value={{ 
            user, 
            setUser, 
            login, 
            logout, 
            isAdmin,
            checkAuth
        }}>
            {children}
        </UserContext.Provider>
    );
}

