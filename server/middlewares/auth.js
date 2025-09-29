const jwt = require("jsonwebtoken");
const { db, adminId } = require("../server");

module.exports.checkAuth = async function checkAuth(req, res, next) {
    const token = req.cookies.authToken; 
    if (!token) {
        return res.status(401).json({ message: "Invalid token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretKey");
        const [rows] = await db.query("SELECT id, username FROM user WHERE id = ?", [decoded.userId]);

        if(rows.length == 0) {
            return false;
        }
        rows[0].role = rows[0].id == adminId ? "admin" : "user";

        req.user = { role: rows[0].role }

        next();

    } catch (err) {
        res.status(401).json({ message: "Token non valido" });
    }
}

module.exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });
        if (!allowedRoles.includes(req.user.role)) {
        }
        next();
    };
}

