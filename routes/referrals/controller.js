const Referrals = require("../../models/referrals");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");

const getAllReferrals = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllReferral = await Referral.find(condition);
    res.json(getAllReferral);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addReferral = async (req, res, next) => {
  const { referralCode, referrerId, referredId } = req.body;
  if (referralCode && referrerId && referredId) {
    const newReferral = new Referral({
      referralCode,
      referrerId,
      referredId,
    });
    try {
      const getReferral = await Referral.find({
        referralCode,
        referrerId,
        referredId,
        deletedAt: {
          $exists: false,
        },
      });
      if (getReferral.length === 0) {
        const createReferral = await newReferral.save();
        res.json(createReferral);
      } else {
        throw new Error("Referral name must be unique");
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(400).json(REQUIRED_VALUE_EMPTY);
  }
};

const updateReferral = async (req, res, next) => {
  const condition = req.body;
  if (!isEmpty(condition)) {
    try {
      const updateReferral = await Referral.findByIdAndUpdate(
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
    res.status(500).json("Referral cannot be found");
  }
};

const deleteReferral = async (req, res, next) => {
  try {
    const getReferral = await Referral.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getReferral.length > 0) {
      const deleteReferral = await Referral.findByIdAndUpdate(req.params.id, {
        $set: {
          deletedAt: Date.now(),
        },
      });
      res.json(deleteReferral);
    } else {
      throw new Error("Referral is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllReferrals,
  addReferral,
  updateReferral,
  deleteReferral,
};
