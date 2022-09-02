const Transaction = require("../../models/transactions");
const { UNKNOWN_ERROR_OCCURRED } = require("../../constants");

const getPaginatedTransactions = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const page = req.query.page ? Number(req.query.page) : 1;
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  if (res.locals.user && String(res.locals.user._id) === condition.userId) {
    try {
      const transactionCounts = await Transaction.find(
        condition
      ).countDocuments();
      const getAllTransactions = await Transaction.find(condition)
        .limit(limit)
        .skip(page === 1 ? 0 : limit * (page - 1))
        .sort({ createdAt: -1 });
      res.json({
        items: getAllTransactions,
        pageCount:
          transactionCounts < limit ? 1 : Math.ceil(transactionCounts / limit),
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
  getPaginatedTransactions,
};
