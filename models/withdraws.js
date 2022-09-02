const mongoose = require("mongoose");
const { Schema } = mongoose;

const withdraws = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  referenceNumber: String,
  amount: Number,
  status: {
    type: String,
    enum: ["Approved", "Declined", "Pending", "Canceled"],
    default: "Pending",
  },
  declineReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  deletedAt: Date,
});

module.exports = mongoose.model("Withdraws", withdraws);
