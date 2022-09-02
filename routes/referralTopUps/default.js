const ReferralTopUps = require("../../models/referralTopUps");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");

const getAllReferralTopUps = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllReferral = await ReferralTopUps.find(condition);
    res.json(getAllReferral);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addReferralTopUp = async (req, res, next) => {
  const { referrerId, referredId, points } = req.body;
  if (points && referrerId && referredId) {
    const newReferral = new ReferralTopUps({
      points,
      referrerId,
      referredId,
    });
    try {
      const getReferral = await ReferralTopUps.find({
        points,
        referrerId,
        referredId, // need to add same date here
        deletedAt: {
          $exists: false,
        },
      });
      if (getReferral.length === 0) {
        const createReferral = await newReferral.save();
        res.json(createReferral);
      } else {
        throw new Error("Referral Top Up must be unique");
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(400).json(REQUIRED_VALUE_EMPTY);
  }
};

const updateReferralTopUp = async (req, res, next) => {
  const condition = req.body;
  if (!isEmpty(condition)) {
    try {
      const updateReferral = await ReferralTopUps.findByIdAndUpdate(
        req.params.id,
        {
          $set: condition,
          updatedAt: Date.now(),
        },
        { new: true }
      );
      res.json(updateReferral);
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(500).json("ReferralTopUps cannot be found");
  }
};

const deleteReferralTopUp = async (req, res, next) => {
  try {
    const getReferral = await ReferralTopUps.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getReferral.length > 0) {
      const deleteReferral = await ReferralTopUps.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            deletedAt: Date.now(),
          },
        }
      );
      res.json(deleteReferral);
    } else {
      throw new Error("ReferralTopUps is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllReferralTopUps,
  addReferralTopUp,
  updateReferralTopUp,
  deleteReferralTopUp,
};
