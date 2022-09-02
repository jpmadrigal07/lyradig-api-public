const Withdraws = require("../../models/withdraws");
const Users = require("../../models/users");
const Transactions = require("../../models/transactions");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");
const CryptoJS = require("crypto-js");
const keys = require("../../config/keys");

const getAllWithdraws = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllWithdraw = await Withdraws.find(condition);
    res.json(getAllWithdraw);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addWithdraw = async (req, res, next) => {
  const { userId, amount, phoneNumber, password } = req.body;
  if (res.locals.user && String(res.locals.user._id) === userId) {
    if (userId && amount) {
      const newWithdraw = new Withdraws({
        userId,
        amount,
      });
      try {
        const verifyUser = await Users.findOne({
          phoneNumber,
          deletedAt: {
            $exists: false,
          },
        });
        const dbPasswordDecrypted = CryptoJS.AES.decrypt(
          verifyUser.password,
          keys.encryptKey
        );
        const dbPassword = dbPasswordDecrypted.toString(CryptoJS.enc.Utf8);
        if (!verifyUser || dbPassword !== password) {
          throw new Error(
            "Account verification failed, phone number or password is wrong"
          );
        }
        const getWithdraw = await Withdraws.find({
          userId,
          amount, // add date here
          status: "Pending",
          deletedAt: {
            $exists: false,
          },
        });
        const checkPointsSufficient = await Users.find({
          _id: userId,
          walletPoints: { $gte: amount },
          deletedAt: {
            $exists: false,
          },
        });
        if (getWithdraw.length > 0) {
          throw new Error("You have a pending request with the same amount");
        } else if (checkPointsSufficient.length === 0) {
          throw new Error("Insufficient wallet points");
        } else {
          const createWithdraw = await newWithdraw.save();
          if (createWithdraw) {
            const newTransaction = new Transactions({
              type: "Withdraw",
              status: "Requested",
              amount: amount,
              userId,
            });
            await newTransaction.save();
          }
          res.json(createWithdraw);
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

const updateWithdraw = async (req, res, next) => {
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
      const withdraw = await Withdraws.findOne({
        _id: req.params.id,
        deletedAt: {
          $exists: false,
        },
      }).populate("userId");
      const isWalletPointsInsufficient =
        condition?.status === "Approved" &&
        withdraw.amount > withdraw.userId.walletPoints;
      if (isWalletPointsInsufficient) {
        throw new Error("Insufficient wallet points");
      }
      delete condition.userId;
      const updateWithdraw = await Withdraws.findByIdAndUpdate(
        req.params.id,
        {
          $set: condition,
          updatedAt: Date.now(),
        },
        { new: true }
      );
      if (updateWithdraw) {
        const newTransaction = new Transactions({
          type: "Withdraw",
          status: updateWithdraw.status,
          amount: withdraw.amount,
          userId: updateWithdraw.userId,
        });
        await newTransaction.save();
      }
      if (updateWithdraw?.status === "Approved") {
        const updateUser = await Users.findByIdAndUpdate(
          withdraw.userId,
          {
            $inc: { walletPoints: -withdraw.amount },
            updatedAt: Date.now(),
          },
          { new: true }
        );
        res.json({ updateWithdraw, updateUser });
      } else {
        res.json(updateWithdraw);
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
    res.status(500).json("Withdraw cannot be found");
  }
};

const deleteWithdraw = async (req, res, next) => {
  try {
    const getWithdraw = await Withdraws.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getWithdraw.length > 0) {
      const deleteWithdraw = await Withdraws.findByIdAndUpdate(req.params.id, {
        $set: {
          deletedAt: Date.now(),
        },
      });
      res.json(deleteWithdraw);
    } else {
      throw new Error("Withdraw is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllWithdraws,
  addWithdraw,
  updateWithdraw,
  deleteWithdraw,
};
