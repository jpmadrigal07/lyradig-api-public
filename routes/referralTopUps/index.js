const express = require("express");
const router = express.Router();
const {
  getAllReferralTopUps,
  addReferralTopUp,
  updateReferralTopUp,
  deleteReferralTopUp,
} = require("./default");

// default
router.get("/", getAllReferralTopUps);
router.post("/", addReferralTopUp);
router.put("/", updateReferralTopUp);
router.delete("/", deleteReferralTopUp);

module.exports = router;
