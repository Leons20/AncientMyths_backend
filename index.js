import express from "express";
import cors from "cors";
import { connectToDatabase } from "./db.js";

const app = express();
const PORT = 3000;

let db = await connectToDatabase();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("AncientMyths");
});

app.listen(PORT, (error) => {
    if (error) {
        console.log("Greška prilikom pokretanja servera", error);
    }
    console.log(`Server radi na http://localhost:${PORT}`);
});
