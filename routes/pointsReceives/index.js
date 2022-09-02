const express = require("express");
const router = express.Router();
const {
  getAllPointsReceives,
  addPointsReceive,
  updatePointsReceive,
  deletePointsReceive,
} = require("./default");
const { isUserLoggedIn } = require("../../helper");

// default
router.get("/", isUserLoggedIn, getAllPointsReceives);
router.post("/", isUserLoggedIn, addPointsReceive);
router.put("/", isUserLoggedIn, updatePointsReceive);
router.delete("/", isUserLoggedIn, deletePointsReceive);

module.exports = router;
