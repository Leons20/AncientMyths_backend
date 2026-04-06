import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt.js";

export const register = async (req, res) => {
    const { username, password, email } = req.body;

    const users = req.db.collection("users");

    if (!username || !password || !email) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = {
        username,
        email,
        password: hashed,
        role: "user",
        favorites: [],
        profileImage: "",
    };

    let result;

    try {
        result = await users.insertOne(newUser);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Username or email already exists" });
        }
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }

    const token = generateToken({
        _id: result.insertedId,
        username: newUser.username,
        role: newUser.role,
    });

    res.json({
        token,
        user: {
            _id: result.insertedId,
            username,
            email,
            role: newUser.role,
        },
    });
};

export const login = async (req, res) => {
    const { username, password } = req.body;

    const users = req.db.collection("users");

    const user = await users.findOne({ username: username });

    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
        _id: user._id,
        username: user.username,
        role: user.role,
    });

    res.json({
        token,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        },
    });
};
