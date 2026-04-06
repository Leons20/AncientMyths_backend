import express from "express";
import cors from "cors";
import { connectToDatabase } from "./db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import mythRoutes from "./routes/mythRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

const app = express();
const PORT = 3000;

let db = await connectToDatabase();

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    req.db = db;
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/myths", mythRoutes);
app.use("/api/reviews", reviewRoutes);

app.get("/", (req, res) => {
    res.send("AncientMyths");
});

app.listen(PORT, (error) => {
    if (error) {
        console.log("Greška prilikom pokretanja servera", error);
    }
    console.log(`Server radi na http://localhost:${PORT}`);
});
