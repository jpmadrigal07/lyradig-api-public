const Transactions = require("../../models/transactions");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");

const getAllTransactions = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllTransaction = await Transactions.find(condition);
    res.json(getAllTransaction);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addTransaction = async (req, res, next) => {
  const { userId, amount, type } = req.body;
  if (res.locals.user && String(res.locals.user._id) === userId) {
    if (userId && amount && type) {
      const newTransaction = new Transactions({
        userId,
        amount,
        type,
      });
      try {
        const start = moment().startOf("day");
        const end = moment().endOf("day");
        const getTransaction = await Transactions.find({
          userId,
          amount,
          type,
          createdAt: { $gte: start, $lt: end },
          deletedAt: {
            $exists: false,
          },
        });
        if (getTransaction.length === 0) {
          const createTransaction = await newTransaction.save();
          res.json(createTransaction);
        } else {
          throw new Error("Transaction must be unique");
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

const updateTransaction = async (req, res, next) => {
  const condition = req.body;
  if (res.locals.user && String(res.locals.user._id) === condition.userId) {
    if (!isEmpty(condition)) {
      try {
        const updateTransaction = await Transactions.findByIdAndUpdate(
          req.params.id,
          {
            $set: condition,
            updatedAt: Date.now(),
          },
          { new: true }
        );
        res.json(updateTransaction);
      } catch ({ message: errMessage }) {
        const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
        res.status(500).json(message);
      }
    } else {
      res.status(500).json("Referral cannot be found");
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

const deleteTransaction = async (req, res, next) => {
  const userId = req.body.userId;
  if (res.locals.user && String(res.locals.user._id) === userId) {
    try {
      const getTransaction = await Transactions.find({
        _id: req.params.id,
        deletedAt: {
          $exists: false,
        },
      });
      if (getTransaction.length > 0) {
        const deleteTransaction = await Transactions.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              deletedAt: Date.now(),
            },
          }
        );
        res.json(deleteTransaction);
      } else {
        throw new Error("Transaction is already deleted");
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

module.exports = {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
};
