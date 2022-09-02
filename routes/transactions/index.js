const express = require("express");
const router = express.Router();
const {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} = require("./default");
const { isUserLoggedIn } = require("../../helper");
const { getPaginatedTransactions } = require("./customGet");

router.get("/", isUserLoggedIn, getAllTransactions);
router.post("/", isUserLoggedIn, addTransaction);
router.put("/", isUserLoggedIn, updateTransaction);
router.delete("/", isUserLoggedIn, deleteTransaction);

// custom get
router.get("/paginated", isUserLoggedIn, getPaginatedTransactions);

module.exports = router;
