const mongoose = require("mongoose");
const { Schema } = mongoose;

const pointsReceives = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  topUpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TopUps",
  },
  referralTopUpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ReferralTopUps",
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

module.exports = mongoose.model("PointsReceives", pointsReceives);
