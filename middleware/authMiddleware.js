import { verifyToken } from "../utils/jwt.js";

export default function (req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);

        req.user = {
            _id: decoded.id,
            username: decoded.username,
            role: decoded.role,
        };

        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
}
