const express = require("express");
const router = express.Router();
const {
  getAllPricePoints,
  addPricePoint,
  updatePricePoint,
  deletePricePoint,
} = require("./controller");
const { isUserLoggedIn } = require("../../helper");

router.get("/", isUserLoggedIn, getAllPricePoints);
router.post("/", isUserLoggedIn, addPricePoint);
router.put("/", isUserLoggedIn, updatePricePoint);
router.delete("/", isUserLoggedIn, deletePricePoint);

module.exports = router;
