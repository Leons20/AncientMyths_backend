import { ObjectId } from "mongodb";

export const getReviews = async (req, res) => {
    try {
        const reviews = req.db.collection("reviews");

        const mythId = new ObjectId(req.params.mythId);

        const data = await reviews
            .aggregate([
                {
                    $match: { mythId: mythId },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        _id: 1,
                        mythId: 1,
                        userId: 1,
                        text: 1,
                        createdAt: 1,
                        username: {
                            $ifNull: ["$user.username", "Unknown"],
                        },
                        profileImage: {
                            $ifNull: ["$user.profileImage", ""],
                        },
                    },
                },
            ])
            .toArray();

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch reviews" });
    }
};

export const addReview = async (req, res) => {
    const reviews = req.db.collection("reviews");
    const users = req.db.collection("users");

    const user = await users.findOne({
        _id: new ObjectId(req.user._id),
    });

    const { mythId, text } = req.body;

    if (!text || !mythId) {
        return res.status(400).json({ message: "Missing data" });
    }

    const newReview = {
        mythId: new ObjectId(mythId),
        userId: user._id,
        text,
        createdAt: new Date(),
    };

    await reviews.insertOne(newReview);

    res.json({ message: "Review created" });
};

export const deleteReview = async (req, res) => {
    try {
        const reviews = req.db.collection("reviews");

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid review id" });
        }

        const reviewId = new ObjectId(req.params.id);

        const review = await reviews.findOne({
            _id: reviewId,
        });

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        await reviews.deleteOne({
            _id: reviewId,
        });

        res.json({ message: "Review deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete review" });
    }
};
