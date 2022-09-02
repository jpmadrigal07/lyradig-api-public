const PointsReceives = require("../models/pointsReceives");
const ReferralTopUps = require("../models/referralTopUps");
const Users = require("../models/users");
const Transactions = require("../models/transactions");
const TopUps = require("../models/topUps");
const { UNKNOWN_ERROR_OCCURRED } = require("../constants");
const uniqBy = require("lodash/uniqBy");
const moment = require("moment");
const momentRange = require("moment-range");
const momentRangeExtend = momentRange.extendMoment(moment);

const collectPoints = async (userId) => {
  try {
    // Find all to topUps that are still active using validUntil if it is less than or equal to 90 days
    const getTopUps = await TopUps.find({
      createdAt: {
        $gte: moment().startOf("day").subtract(90, "d"),
      },
      deletedAt: {
        $exists: false,
      },
      status: "Approved",
      userId,
    }).populate("pricePoints");
    // Remapped topUps Id
    const start = moment().startOf("day");
    const end = moment().endOf("day");
    const getPointsReceivedToday = await PointsReceives.find({
      createdAt: { $gte: start, $lt: end },
    });
    if (
      getTopUps &&
      getTopUps.length > 0 &&
      getPointsReceivedToday &&
      getPointsReceivedToday.length === 0
    ) {
      const topUpsIds =
        getTopUps && getTopUps.length > 0
          ? getTopUps.map((topUp) => topUp._id)
          : [];
      // Find all last pointsReceived of all active topUps
      const getPointsReceived = await PointsReceives.find({
        topUpId: { $in: topUpsIds },
      }).sort({ createdAt: -1 });
      // Unique pointsReceived
      const uniquePointsReceived = uniqBy(
        JSON.parse(JSON.stringify(getPointsReceived)),
        "topUpId"
      );
      // Find all days between last pointsReceived and now
      const getDays = uniquePointsReceived
        .map((pointsReceived) => {
          const isDateCompleted = moment(pointsReceived.createdAt).isSame(
            new Date(),
            "day"
          );
          if (!isDateCompleted) {
            const lastPointReceivedDate = moment(pointsReceived.createdAt)
              .startOf("day")
              .add(1, "d");
            const dateNow = moment().endOf("day");
            const range = momentRangeExtend.range(
              lastPointReceivedDate,
              dateNow
            );
            const arrayOfDates = Array.from(range.by("days"));
            return {
              topUpId: pointsReceived.topUpId,
              dates: arrayOfDates,
            };
          }
        })
        .filter((item) => item);
      // Added empty dates
      const addedEmptyDates = getTopUps
        .map((topUp) => {
          const topUpData = getDays.find((item) => item.topUpId == topUp._id);
          const isTopUpNew = moment(topUp.createdAt).isSame(new Date(), "day");
          if (topUpData && !isTopUpNew) {
            return topUpData;
          } else if (!topUpData && !isTopUpNew) {
            const lastPointReceivedDate = moment(topUp.createdAt)
              .startOf("day")
              .add(1, "d");
            const dateNow = moment().endOf("day");
            const range = momentRangeExtend.range(
              lastPointReceivedDate,
              dateNow
            );
            const arrayOfDates = Array.from(range.by("days"));
            return {
              topUpId: topUp._id,
              dates: arrayOfDates,
            };
          }
        })
        .filter((item) => item);
      if (addedEmptyDates.length > 0) {
        const toUpdate = addedEmptyDates.map((topUp) => {
          const topUpData = getTopUps.find((item) => item._id == topUp.topUpId);
          return topUp.dates.map((date) => {
            return {
              insertOne: {
                document: {
                  userId,
                  topUpId: topUp.topUpId,
                  date: moment(date).format(),
                  points: topUpData.pricePoints.points,
                },
              },
            };
          });
        });
        await PointsReceives.bulkWrite(toUpdate.flat());
        secondProcess(userId);
      } else {
        console.log("No points collected for " + userId);
      }
    } else {
      console.log("No points collected for " + userId);
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    console.log("Error first process for " + userId + ": " + message);
  }
};

const secondProcess = async (userId) => {
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
    const getTotalPoints = [...getPointsReceives, ...getReferralTopUps].reduce(
      (acc, curr) => acc + curr.points,
      0
    );
    const toUpdatePointsReceives = getPointsReceives.map((pointReceive) => {
      return {
        updateOne: {
          filter: { _id: pointReceive._id },
          update: { $set: { isCollected: true } },
        },
      };
    });
    const toUpdateReferralTopUps = getReferralTopUps.map((referralTopUp) => {
      return {
        updateOne: {
          filter: { _id: referralTopUp._id },
          update: { $set: { isCollected: true } },
        },
      };
    });
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

    const regularPointsTransaction = getPointsReceives.map((pointsReceive) => {
      return {
        insertOne: {
          document: {
            amount: pointsReceive.points,
            type: "Earned Points",
            status: "Received",
            userId,
          },
        },
      };
    });

    const referralPointsTransaction = getReferralTopUps.map((pointsReceive) => {
      return {
        insertOne: {
          document: {
            amount: pointsReceive.points,
            type: "Referral Earned Points",
            status: "Received",
            userId,
          },
        },
      };
    });

    const bulkRegularPointsTransaction =
      regularPointsTransaction.length > 0
        ? await Transactions.bulkWrite(regularPointsTransaction)
        : {};

    const bulkReferralPointsTransaction =
      referralPointsTransaction.length > 0
        ? await Transactions.bulkWrite(referralPointsTransaction)
        : {};

    console.log(
      "Collected points for " +
        userId +
        ": " +
        {
          updateUser,
          bulkPointsReceives,
          bulkReferralTopUps,
          bulkRegularPointsTransaction,
          bulkReferralPointsTransaction,
        }
    );
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    console.log("Error second process for " + userId + ": " + message);
  }
};

module.exports = {
  collectPoints,
};
