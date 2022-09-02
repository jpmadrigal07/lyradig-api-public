const TopUps = require("../../models/topUps");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");

const getPaginatedTopUps = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const page = req.query.page ? Number(req.query.page) : 1;
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  if (res.locals.user && String(res.locals.user._id) === condition.userId) {
    // if admin, remove condition userId to get all records
    if (
      res.locals.user.userType === "Admin" ||
      res.locals.user.userType === "Staff"
    ) {
      delete condition.userId;
    }
    try {
      const topUpsCounts = await TopUps.find(condition).countDocuments();
      const getAllTopUps = await TopUps.find(condition)
        .populate([
          {
            path: "staffId",
            model: "Users",
          },
          {
            path: "pricePoints",
            model: "PricePoints",
          },
        ])
        .limit(limit)
        .skip(page === 1 ? 0 : limit * (page - 1))
        .sort({ createdAt: -1 });
      res.json({
        items: getAllTopUps,
        pageCount: topUpsCounts < limit ? 1 : Math.ceil(topUpsCounts / limit),
        page,
      });
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

const getTotalTopUps = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  if (res.locals.user && String(res.locals.user._id) === condition.userId) {
    try {
      const getAllTopUps = await TopUps.find(condition).populate([
        {
          path: "pricePoints",
          model: "PricePoints",
        },
      ]);
      const getTotalPoints = getAllTopUps.reduce(
        (acc, curr) => acc + curr.pricePoints.points,
        0
      );
      const getTotalPrice = getAllTopUps.reduce(
        (acc, curr) => acc + curr.pricePoints.price,
        0
      );
      res.json({
        points: getTotalPoints,
        price: getTotalPrice,
      });
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

module.exports = {
  getPaginatedTopUps,
  getTotalTopUps,
};
