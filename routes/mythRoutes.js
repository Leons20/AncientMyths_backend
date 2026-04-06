import express from "express";
import {
    getMyths,
    getMyth,
    createMyth,
    updateMyth,
    deleteMyth,
    rateMyth,
} from "../controllers/mythController.js";

import auth from "../middleware/authMiddleware.js";
import admin from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", getMyths);
router.get("/:id", auth, getMyth);

router.post("/", auth, createMyth);
router.put("/:id", auth, admin, updateMyth);
router.delete("/:id", auth, admin, deleteMyth);

router.post("/:id/rate", auth, rateMyth);

export default router;
