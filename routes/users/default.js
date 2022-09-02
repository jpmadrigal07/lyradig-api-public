const Users = require("../../models/users");
const Referrals = require("../../models/referrals");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");
const keys = require("../../config/keys");
const CryptoJS = require("crypto-js");
const cron = require("node-cron");
const { initUserPointsCollection } = require("../../cron/init");

const generateReferralCode = () => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const getAllUsers = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllUser = await Users.find(condition);
    res.json(getAllUser);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addUser = async (req, res, next) => {
  const { email, phoneNumber, password, firstName, lastName, referralCode } =
    req.body;
  if (email && phoneNumber && password) {
    const encryptPassword = CryptoJS.AES.encrypt(
      password,
      keys.encryptKey
    ).toString();
    const newUser = new Users({
      email,
      phoneNumber,
      password: encryptPassword,
      firstName,
      lastName,
      userType: "User",
      referralCode: generateReferralCode(),
    });
    try {
      const getUser = await Users.find({
        $or: [{ email }, { phoneNumber }],
        deletedAt: {
          $exists: false,
        },
      });
      if (getUser.length === 0) {
        if (referralCode) {
          const originalReferralCode = referralCode.slice(0, 10);
          const lastFiveReferralCode = referralCode.slice(
            referralCode.length - 5
          );
          const getReferrer = await Users.findOne({
            referralCode: originalReferralCode,
            deletedAt: {
              $exists: false,
            },
          });
          if (getReferrer) {
            const referrerId = `${getReferrer._id}`;
            const referrerIdLastFive = referrerId.slice(referrerId.length - 5);
            if (referrerIdLastFive === lastFiveReferralCode) {
              const createUser = await newUser.save();
              initUserPointsCollection(createUser._id);
              const newReferral = new Referrals({
                referralCode,
                referredId: createUser._id,
                referrerId: getReferrer._id,
              });
              await newReferral.save();
              res.json(createUser);
            } else {
              throw new Error(
                "Referral code is invalid, please clarify it to your referrer"
              );
            }
          } else {
            throw new Error(
              "Referral code is invalid, please clarify it to your referrer"
            );
          }
        } else {
          const createUser = await newUser.save();
          initUserPointsCollection(createUser._id);
          res.json(createUser);
        }
      } else {
        throw new Error("Email or phone number already in use");
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(400).json(REQUIRED_VALUE_EMPTY);
  }
};

const updateUser = async (req, res, next) => {
  if (
    res.locals.user &&
    (String(res.locals.user._id) === req.params.id ||
      res.locals.user.userType === "Admin")
  ) {
    const condition = req.body;
    if (!isEmpty(condition)) {
      try {
        const updateUser = await Users.findByIdAndUpdate(
          req.params.id,
          {
            $set: condition,
            updatedAt: Date.now(),
          },
          { new: true }
        );
        res.json(updateUser);
      } catch ({ message: errMessage }) {
        const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
        res.status(500).json(message);
      }
    } else {
      res.status(500).json("User cannot be found");
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const getUser = await Users.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getUser.length > 0) {
      const deleteUser = await Users.findByIdAndUpdate(req.params.id, {
        $set: {
          deletedAt: Date.now(),
        },
      });
      res.json(deleteUser);
    } else {
      throw new Error("User is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllUsers,
  addUser,
  updateUser,
  deleteUser,
};
