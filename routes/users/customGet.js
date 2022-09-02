const Users = require("../../models/users");
const Transactions = require("../../models/transactions");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const moment = require("moment");

const verifyAuth = async (req, res, next) => {
  const token = req.query.token;
  try {
    // Check if token is defined
    if (!token) {
      throw new Error("Authentication is invalid");
    }
    // Verify the token
    const { email, phoneNumber } = jwt.verify(token, keys.signKey);
    // Check if email exist in db
    const user = await Users.findOne({ email, phoneNumber });
    if (!user || (user && user.deletedAt)) {
      throw new Error("We cannot find your account in our system");
    }
    if (user && user.blockedAt) {
      throw new Error("User was prohibited to login due to violations");
    }
    res.json(user);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    if (message === "jwt malformed") {
      res.status(401).json("Invalid authentication credentials");
    } else if (message === "Authentication is invalid") {
      res.status(401).json(message);
    } else if (message === "jwt expired") {
      res.status(403).json("Authentication is expired, please login again");
    } else {
      res.status(500).json(message);
    }
  }
};

const getPointsSummary = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  if (res.locals.user && String(res.locals.user._id) === condition.userId) {
    try {
      const getAllEarnedPoints = await Transactions.find({
        ...condition,
        type: "Earned Points",
        status: "Received",
      });
      const getAllReferralPoints = await Transactions.find({
        ...condition,
        type: "Referral Earned Points",
        status: "Received",
      });
      const start = moment().startOf("day");
      const end = moment().endOf("day");
      const getAllEarnedPointsToday = await Transactions.find({
        ...condition,
        $or: [{ type: "Referral Earned Points" }, { type: "Earned Points" }],
        status: "Received",
        createdAt: { $gte: start, $lt: end },
      });
      const getTotalEarnedPoints = getAllEarnedPoints.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );
      const getTotalReferralPoints = getAllReferralPoints.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );
      const getTotalEarnedPointsToday = getAllEarnedPointsToday.reduce(
        (acc, curr) => acc + curr.amount,
        0
      );
      res.json({
        earnedPoints: getTotalEarnedPoints,
        referralPoints: getTotalReferralPoints,
        todayEarnedPoints: getTotalEarnedPointsToday,
      });
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

const getPaginatedStaffs = async (req, res, next) => {
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
      const usersCounts = await Users.find(condition).countDocuments();
      const getAllUsers = await Users.find(condition)
        .limit(limit)
        .skip(page === 1 ? 0 : limit * (page - 1))
        .sort({ createdAt: -1 });
      res.json({
        items: getAllUsers,
        pageCount: usersCounts < limit ? 1 : Math.ceil(usersCounts / limit),
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

module.exports = {
  verifyAuth,
  getPointsSummary,
  getPaginatedStaffs,
};
