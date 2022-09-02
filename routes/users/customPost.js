const PointsReceives = require("../../models/pointsReceives");
const ReferralTopUps = require("../../models/referralTopUps");
const Transactions = require("../../models/transactions");
const Users = require("../../models/users");
const { UNKNOWN_ERROR_OCCURRED } = require("../../constants");
const keys = require("../../config/keys");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

const collectWalletPoints = async (req, res, next) => {
  if (res.locals.user) {
    const userId = res.locals.user._id;
    if (userId) {
      try {
        const getPointsReceives = await PointsReceives.find({
          userId,
          $or: [{ isCollected: false }, { isCollected: { $exists: false } }],
          deletedAt: {
            $exists: false,
          },
        });
        const getReferralTopUps = await ReferralTopUps.find({
          referredId: userId,
          $or: [{ isCollected: false }, { isCollected: { $exists: false } }],
          deletedAt: {
            $exists: false,
          },
        });
        const getTotalPoints = [
          ...getPointsReceives,
          ...getReferralTopUps,
        ].reduce((acc, curr) => acc + curr.points, 0);
        const toUpdatePointsReceives = getPointsReceives.map((pointReceive) => {
          return {
            updateOne: {
              filter: { _id: pointReceive._id },
              update: { $set: { isCollected: true } },
            },
          };
        });
        const toUpdateReferralTopUps = getReferralTopUps.map(
          (referralTopUp) => {
            return {
              updateOne: {
                filter: { _id: referralTopUp._id },
                update: { $set: { isCollected: true } },
              },
            };
          }
        );
        const updateUser = await Users.updateOne(
          { _id: userId },
          { $inc: { walletPoints: getTotalPoints } }
        );
        const bulkPointsReceives =
          toUpdatePointsReceives.length > 0
            ? await PointsReceives.bulkWrite(toUpdatePointsReceives.flat())
            : {};
        const bulkReferralTopUps =
          toUpdateReferralTopUps.length > 0
            ? await ReferralTopUps.bulkWrite(toUpdateReferralTopUps.flat())
            : {};

        const regularPointsTransaction =
          getPointsReceives.length > 0
            ? getPointsReceives.map((pointsReceive) => {
                return {
                  insertOne: {
                    amount: pointsReceive.points,
                    type: "Earned Points",
                    status: "Received",
                  },
                };
              })
            : [];

        const referralPointsTransaction =
          getReferralTopUps.length > 0
            ? getReferralTopUps.map((pointsReceive) => {
                return {
                  insertOne: {
                    amount: pointsReceive.points,
                    type: "Referral Earned Points",
                    status: "Received",
                  },
                };
              })
            : [];

        const bulkRegularPointsTransaction =
          regularPointsTransaction.length > 0
            ? await Transactions.bulkWrite(regularPointsTransaction.flat())
            : {};

        const bulkReferralPointsTransaction =
          referralPointsTransaction.length > 0
            ? await Transactions.bulkWrite(referralPointsTransaction.flat())
            : {};

        res.json({
          updateUser,
          bulkPointsReceives,
          bulkReferralTopUps,
          bulkRegularPointsTransaction,
          bulkReferralPointsTransaction,
        });
      } catch ({ message: errMessage }) {
        const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
        res.status(500).json(message);
      }
    } else {
      res.status(500).json("Required values are missing");
    }
  } else {
    res.status(403).json("No product price has been saved");
  }
};

const auth = async (req, res, next) => {
  const { username, password } = req.body;
  if ((username, password)) {
    try {
      const user = await Users.findOne({
        $or: [{ email: username }, { phoneNumber: username }],
      });
      if (!user || (user && user.deletedAt)) {
        throw new Error("Account does not exist in our system");
      }
      if (user && user.blockedAt) {
        throw new Error("Account was prohibited to login due to violations");
      }
      const encryptPassword = CryptoJS.AES.decrypt(
        user.password,
        keys.encryptKey
      );
      const originalPassword = encryptPassword.toString(CryptoJS.enc.Utf8);
      if (originalPassword !== password) {
        throw new Error("Phone number or password is invalid");
      } else {
        const token = jwt.sign(
          {
            id: user.id,
            phoneNumber: user.phoneNumber,
            email: user.email,
            userType: user.userType,
          },
          keys.signKey,
          { expiresIn: "1d" }
        );
        if (res.locals.user) {
          delete res.locals.user;
        }
        res.json({ token, userType: user.userType });
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(500).json("Required values are missing");
  }
};

module.exports = {
  auth,
};
