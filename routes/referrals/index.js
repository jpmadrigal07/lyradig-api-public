const express = require("express");
const router = express.Router();
const {
  getAllReferrals,
  addReferral,
  updateReferral,
  deleteReferral,
} = require("./controller");

router.get("/", getAllReferrals);
router.post("/", addReferral);
router.put("/", updateReferral);
router.delete("/", deleteReferral);

module.exports = router;
