import { ObjectId } from "mongodb";

export const getAllUsers = async (req, res) => {
    try {
        const users = req.db.collection("users");

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const data = await users.find().toArray();

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const users = req.db.collection("users");

        const user = await users.findOne({
            _id: new ObjectId(req.user._id),
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch user" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const users = req.db.collection("users");
        const reviews = req.db.collection("reviews");

        const userId = new ObjectId(req.user._id);

        const updatedData = {};

        if (req.body.fullName !== undefined) {
            updatedData.fullName = req.body.fullName;
        }

        if (req.body.email !== undefined) {
            updatedData.email = req.body.email;
        }

        if (req.body.profileImage !== undefined) {
            updatedData.profileImage = req.body.profileImage;
        }

        if (req.body.selectedMythology !== undefined) {
            updatedData.selectedMythology = req.body.selectedMythology;
        }

        await users.updateOne({ _id: userId }, { $set: updatedData });

        if (req.body.profileImage !== undefined) {
            await reviews.updateMany(
                { userId: userId },
                {
                    $set: {
                        profileImage: req.body.profileImage,
                    },
                },
            );
        }

        const updatedUser = await users.findOne({ _id: userId });

        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update profile" });
    }
};

export const getFavorites = async (req, res) => {
    const users = req.db.collection("users");
    const myths = req.db.collection("myths");

    const user = await users.findOne({
        _id: new ObjectId(req.user._id),
    });

    const favoriteIds = user.favorites || [];

    const favoriteMyths = await myths.find({ _id: { $in: favoriteIds } }).toArray();

    res.json(favoriteMyths);
};

export const addFavorite = async (req, res) => {
    const users = req.db.collection("users");

    const { mythId } = req.body;

    await users.updateOne(
        { _id: new ObjectId(req.user._id) },
        {
            $addToSet: {
                favorites: new ObjectId(mythId),
            },
        },
    );

    res.json({ message: "Added to favorites" });
};

export const removeFavorite = async (req, res) => {
    const users = req.db.collection("users");

    const mythId = req.params.mythId;

    await users.updateOne(
        { _id: new ObjectId(req.user._id) },
        {
            $pull: {
                favorites: new ObjectId(mythId),
            },
        },
    );

    res.json({ message: "Removed from favorites" });
};

export const getStats = async (req, res) => {
    try {
        const usersCol = req.db.collection("users");
        const mythsCol = req.db.collection("myths");
        const reviewsCol = req.db.collection("reviews");

        const totalUsers = await usersCol.countDocuments();
        const totalMyths = await mythsCol.countDocuments();
        const totalReviews = await reviewsCol.countDocuments();

        const users = await usersCol.find().toArray();
        const myths = await mythsCol.find().toArray();

        const allMythIds = myths.map((m) => m._id.toString());

        let totalFavorites = 0;

        users.forEach((u) => {
            if (u.favorites && Array.isArray(u.favorites)) {
                u.favorites.forEach((favId) => {
                    if (allMythIds.includes(favId.toString())) {
                        totalFavorites++;
                    }
                });
            }
        });

        let ratingsSum = 0;
        let ratingsCount = 0;

        myths.forEach((m) => {
            if (m.ratings && Array.isArray(m.ratings)) {
                m.ratings.forEach((r) => {
                    ratingsSum += r.value;
                    ratingsCount++;
                });
            }
        });

        const avgRating = ratingsCount === 0 ? 0 : ratingsSum / ratingsCount;

        res.json({
            totalUsers,
            totalMyths,
            totalReviews,
            totalFavorites,
            avgRating,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch stats" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const users = req.db.collection("users");
        const reviews = req.db.collection("reviews");
        const myths = req.db.collection("myths");

        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden" });
        }

        const userId = new ObjectId(req.params.id);

        const user = await users.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await reviews.deleteMany({ username: user.username });

        await myths.updateMany(
            {},
            {
                $pull: {
                    ratings: { userId: userId },
                },
            },
        );

        await users.deleteOne({ _id: userId });

        res.json({ message: "User deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete user" });
    }
};
