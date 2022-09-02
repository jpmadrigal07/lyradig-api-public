const TopUps = require("../../models/topUps");
const Referral = require("../../models/referrals");
const PricePoints = require("../../models/pricePoints");
const ReferralTopUps = require("../../models/referralTopUps");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");
const Transactions = require("../../models/transactions");

const getAllTopUps = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const topUpsCounts = await TopUps.find(condition);
    res.json(topUpsCounts);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addTopUp = async (req, res, next) => {
  const { userId, pricePoints, referenceNumber } = req.body;
  if (res.locals.user && String(res.locals.user._id) === userId) {
    if (userId && pricePoints && referenceNumber) {
      const newTopUps = new TopUps({
        userId,
        pricePoints,
        referenceNumber,
      });
      try {
        const getTopUps = await TopUps.find({
          referenceNumber,
          deletedAt: {
            $exists: false,
          },
        });
        if (getTopUps.length === 0) {
          const createTopUps = await newTopUps.save();
          if (createTopUps) {
            const pricePoint = await PricePoints.findOne({ _id: pricePoints });
            const newTransaction = new Transactions({
              type: "Top up",
              status: "Submitted",
              amount: pricePoint.points,
              userId,
            });
            await newTransaction.save();
          }
          res.json(createTopUps);
        } else {
          throw new Error("Reference number was used before");
        }
      } catch ({ message: errMessage }) {
        const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
        res.status(500).json(message);
      }
    } else {
      res.status(400).json(REQUIRED_VALUE_EMPTY);
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

const updateTopUp = async (req, res, next) => {
  const condition = req.body;
  const userId = req.body.userId;
  if (!isEmpty(condition)) {
    try {
      if (
        (res.locals.user && String(res.locals.user._id) !== userId) ||
        (condition.staffId && res.locals.user.userType === "User") ||
        (condition.status &&
          (condition.status === "Approved" ||
            condition.status === "Declined") &&
          res.locals.user.userType === "User")
      ) {
        throw new Error("Unauthorized action");
      }
      delete condition.userId;
      const updateTopUps = await TopUps.findByIdAndUpdate(
        req.params.id,
        {
          $set: condition,
          updatedAt: Date.now(),
        },
        { new: true }
      ).populate("pricePoints");
      if (updateTopUps) {
        const topUp = await TopUps.findOne({ _id: req.params.id }).populate(
          "pricePoints"
        );
        const newTransaction = new Transactions({
          type: "Top up",
          status: updateTopUps?.status,
          amount: topUp.pricePoints.points,
          userId: updateTopUps.userId,
        });
        await newTransaction.save();
      }
      if (updateTopUps?.status === "Approved") {
        const isUserReferred = await Referral.findOne({
          referredId: updateTopUps.referredId,
          deletedAt: {
            $exists: false,
          },
        });
        if (isUserReferred) {
          const newReferralTopUps = new ReferralTopUps({
            points: updateTopUps?.pricePoints?.points,
            referrerId: isUserReferred?.referrerId,
            referredId: isUserReferred?.referredId,
          });
          const createReferralTopUps = await newReferralTopUps.save();
          res.json({ updateTopUps, createReferralTopUps });
        } else {
          res.json(updateTopUps);
        }
      } else {
        res.json(updateTopUps);
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      if (message === "Unauthorized action") {
        res.status(403).json(message);
      } else {
        res.status(500).json(message);
      }
    }
  } else {
    res.status(500).json("TopUps cannot be found");
  }
};

const deleteTopUp = async (req, res, next) => {
  try {
    const getTopUps = await TopUps.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getTopUps.length > 0) {
      const deleteTopUps = await TopUps.findByIdAndUpdate(req.params.id, {
        $set: {
          deletedAt: Date.now(),
        },
      });
      res.json(deleteTopUps);
    } else {
      throw new Error("TopUps is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllTopUps,
  addTopUp,
  updateTopUp,
  deleteTopUp,
};
