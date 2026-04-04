import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export const generateToken = (user) => {
    return jwt.sign({ id: user._id, username: user.username, role: user.role }, SECRET, {
        expiresIn: "7d",
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, SECRET);
};
