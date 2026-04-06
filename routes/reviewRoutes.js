import express from "express";
import { getReviews, addReview, deleteReview } from "../controllers/reviewController.js";

import auth from "../middleware/authMiddleware.js";
import admin from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/:mythId", getReviews);
router.post("/", auth, addReview);
router.delete("/:id", auth, admin, deleteReview);

export default router;
