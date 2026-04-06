import express from "express";
import {
    getAllUsers,
    getCurrentUser,
    updateProfile,
    getFavorites,
    addFavorite,
    removeFavorite,
    getStats,
    deleteUser,
} from "../controllers/userController.js";

import auth from "../middleware/authMiddleware.js";
import admin from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", auth, getAllUsers);
router.get("/me", auth, getCurrentUser);
router.put("/profile", auth, updateProfile);

router.get("/favorites", auth, getFavorites);
router.post("/favorites", auth, addFavorite);
router.delete("/favorites/:mythId", auth, removeFavorite);

router.get("/stats", auth, admin, getStats);

router.delete("/:id", auth, deleteUser);

export default router;
