const mongoose = require("mongoose");
const { Schema } = mongoose;

const pricePoints = new Schema({
  price: Number,
  points: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  deletedAt: Date,
});

module.exports = mongoose.model("PricePoints", pricePoints);
