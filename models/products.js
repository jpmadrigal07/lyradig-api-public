const mongoose = require("mongoose");
const { Schema } = mongoose;

const products = new Schema({
  name: String,
  level: String,
  price: Number,
  additionalPrice: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  deletedAt: Date,
});

module.exports = mongoose.model("Products", products);
