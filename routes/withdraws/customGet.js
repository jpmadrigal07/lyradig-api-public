const Withdraws = require("../../models/withdraws");
const { UNKNOWN_ERROR_OCCURRED } = require("../../constants");

const getPaginatedWithdraws = async (req, res, next) => {
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
      const withdrawsCounts = await Withdraws.find(condition).countDocuments();
      const getAllWithdraws = await Withdraws.find(condition)
        .populate([
          {
            path: "userId",
            model: "Users",
          },
          {
            path: "staffId",
            model: "Users",
          },
        ])
        .limit(limit)
        .skip(page === 1 ? 0 : limit * (page - 1))
        .sort({ createdAt: -1 });
      res.json({
        items: getAllWithdraws,
        pageCount:
          withdrawsCounts < limit ? 1 : Math.ceil(withdrawsCounts / limit),
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

const getTotalWithdraws = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  if (res.locals.user && String(res.locals.user._id) === condition.userId) {
    try {
      const getAllWithdraws = await Withdraws.find(condition).populate([
        {
          path: "pricePoints",
          model: "PricePoints",
        },
      ]);
      const getTotalAmount = getAllWithdraws.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );
      res.json({
        amount: getTotalAmount,
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
  getPaginatedWithdraws,
  getTotalWithdraws,
};
