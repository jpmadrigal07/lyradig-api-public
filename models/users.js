const mongoose = require("mongoose");
const { Schema } = mongoose;

const users = new Schema({
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: String,
  lastName: String,
  middleName: String,
  dateOfBirth: Date,
  walletPoints: Number,
  isReferred: Boolean,
  userType: {
    type: String,
    enum: ["Admin", "Staff", "User"],
  },
  referralCode: {
    type: String,
    required: true,
    unique: true,
  },
  lastLoggedIn: Date,
  lastLoggedOut: Date,
  blockedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
  deletedAt: Date,
});

module.exports = mongoose.model("Users", users);
