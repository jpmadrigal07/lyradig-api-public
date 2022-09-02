const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactions = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  amount: Number,
  type: {
    type: String,
    enum: ["Earned Points", "Referral Earned Points", "Top up", "Withdraw"],
  },
  status: {
    type: String,
    enum: [
      "Approved",
      "Declined",
      "Pending",
      "Canceled",
      "Submitted",
      "Requested",
      "Received",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  deletedAt: Date,
});

module.exports = mongoose.model("Transactions", transactions);
