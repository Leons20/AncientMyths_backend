import { ObjectId } from "mongodb";

export const getMyths = async (req, res) => {
    const myths = req.db.collection("myths");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const mythology = req.query.mythology;

    const filter = {};

    if (search) {
        filter.title = { $regex: search, $options: "i" };
    }

    if (mythology) {
        filter.mythology = mythology;
    }

    try {
        const total = await myths.countDocuments(filter);

        const data = await myths
            .find(filter)
            .sort({ title: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        res.json({
            myths: data,
            total: total,
            page: page,
            limit: limit,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch myths" });
    }
};

export const getMyth = async (req, res) => {
    const myth = await req.db.collection("myths").findOne({ _id: new ObjectId(req.params.id) });

    if (!myth) {
        return res.status(404).json({ message: "Not found" });
    }

    let userRating = null;

    if (req.user && myth.ratings) {
        const found = myth.ratings.find((r) => r.userId.toString() === req.user.id);

        if (found) {
            userRating = found.value;
        }
    }

    const response = {
        _id: myth._id,
        title: myth.title,
        mythology: myth.mythology,
        mythText: myth.mythText,
        interpretation: myth.interpretation,
        image: myth.image,
        link: myth.link,
        ratings: myth.ratings || [],
        isDefault: myth.isDefault || false,
        userRating: userRating,
    };

    res.json(response);
};

export const createMyth = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const myths = req.db.collection("myths");

    if (
        !req.body.title ||
        !req.body.mythology ||
        !req.body.mythText ||
        !req.body.interpretation ||
        !req.body.image ||
        !req.body.link
    ) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const newMyth = {
        title: req.body.title,
        mythology: req.body.mythology,
        mythText: req.body.mythText,
        interpretation: req.body.interpretation,
        image: req.body.image,
        link: req.body.link,
        ratings: [],
        isDefault: false,
    };

    try {
        await myths.insertOne(newMyth);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Myth already exists" });
        }
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }

    res.json({ message: "Created" });
};

export const updateMyth = async (req, res) => {
    try {
        await req.db.collection("myths").updateOne(
            { _id: new ObjectId(req.params.id) },
            {
                $set: {
                    title: req.body.title,
                    mythology: req.body.mythology,
                    mythText: req.body.mythText,
                    interpretation: req.body.interpretation,
                    image: req.body.image,
                    link: req.body.link,
                },
            },
        );
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Myth already exists" });
        }
        console.error(err);
        return res.status(500).json({ message: "Server error" });
    }

    res.json({ message: "Updated" });
};

export const deleteMyth = async (req, res) => {
    const myths = req.db.collection("myths");
    const reviews = req.db.collection("reviews");
    const users = req.db.collection("users");

    const mythId = new ObjectId(req.params.id);

    const myth = await myths.findOne({ _id: mythId });

    if (!myth) {
        return res.status(404).json({ message: "Myth not found" });
    }

    if (myth.isDefault) {
        return res.status(403).json({ message: "Cannot delete default myth" });
    }

    await myths.deleteOne({ _id: mythId });
    await reviews.deleteMany({ mythId: mythId });
    await users.updateMany(
        {},
        {
            $pull: { favorites: mythId },
        },
    );

    res.json({ message: "Deleted" });
};

export const rateMyth = async (req, res) => {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Invalid rating" });
    }

    const myths = req.db.collection("myths");

    const userId = new ObjectId(req.user._id || req.user.id);
    const mythId = new ObjectId(req.params.id);

    const myth = await myths.findOne({ _id: mythId });

    if (!myth) {
        return res.status(404).json({ message: "Myth not found" });
    }

    const existingRating = (myth.ratings || []).find(
        (r) => r.userId.toString() === userId.toString(),
    );

    if (existingRating) {
        await myths.updateOne(
            {
                _id: mythId,
                "ratings.userId": userId,
            },
            {
                $set: {
                    "ratings.$.value": rating,
                },
            },
        );
    } else {
        await myths.updateOne(
            { _id: mythId },
            {
                $push: {
                    ratings: {
                        userId: userId,
                        value: rating,
                    },
                },
            },
        );
    }

    res.json({ message: "Rated" });
};
