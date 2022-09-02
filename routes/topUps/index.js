const express = require("express");
const router = express.Router();
const {
  getAllTopUps,
  addTopUp,
  updateTopUp,
  deleteTopUp,
} = require("./default");
const { isUserLoggedIn } = require("../../helper");
const { getPaginatedTopUps, getTotalTopUps } = require("./customGet");

router.get("/", isUserLoggedIn, getAllTopUps);
router.post("/", isUserLoggedIn, addTopUp);
router.patch("/:id", isUserLoggedIn, updateTopUp);
router.delete("/:id", isUserLoggedIn, deleteTopUp);

// custom get
router.get("/paginated", isUserLoggedIn, getPaginatedTopUps);
router.get("/total", isUserLoggedIn, getTotalTopUps);

module.exports = router;
