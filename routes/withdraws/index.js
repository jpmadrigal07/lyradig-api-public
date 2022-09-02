const express = require("express");
const router = express.Router();
const {
  getAllWithdraws,
  addWithdraw,
  updateWithdraw,
  deleteWithdraw,
} = require("./default");
const { isUserLoggedIn } = require("../../helper");
const { getPaginatedWithdraws, getTotalWithdraws } = require("./customGet");

router.get("/", isUserLoggedIn, getAllWithdraws);
router.post("/", isUserLoggedIn, addWithdraw);
router.patch("/:id", isUserLoggedIn, updateWithdraw);
router.delete("/:id", isUserLoggedIn, deleteWithdraw);

// custom get
router.get("/paginated", isUserLoggedIn, getPaginatedWithdraws);
router.get("/total", isUserLoggedIn, getTotalWithdraws);

module.exports = router;
