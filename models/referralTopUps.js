const mongoose = require("mongoose");
const { Schema } = mongoose;

const referralTopUps = new Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  referredId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  points: Number,
  isCollected: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  deletedAt: Date,
});

module.exports = mongoose.model("ReferralTopUps", referralTopUps);
