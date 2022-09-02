const mongoose = require("mongoose");
const { Schema } = mongoose;

const pointsReceives = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  token: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  deletedAt: Date,
});

module.exports = mongoose.model("PointsReceives", pointsReceives);
