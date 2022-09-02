const PointsReceives = require("../../models/pointsReceives");
const TopUps = require("../../models/topUps");
const { UNKNOWN_ERROR_OCCURRED } = require("../../constants");
const uniqBy = require("lodash/uniqBy");
const moment = require("moment");
const momentRange = require("moment-range");
const momentRangeExtend = momentRange.extendMoment(moment);

const collectPointsReceives = async (req, res, next) => {
  if (res.locals.user) {
    const userId = res.locals.user._id;
    if (userId) {
      try {
        // Find all to topUps that are still active using validUntil if it is less than or equal to 90 days
        const getTopUps = await TopUps.find({
          createdAt: {
            $gte: moment().startOf("day").subtract(90, "d"),
          },
          deletedAt: {
            $exists: false,
          },
          userId,
          status: "Approved",
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
            $or: [{ isCollected: false }, { isCollected: { $exists: false } }],
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
              const topUpData = getDays.find(
                (item) => item.topUpId == topUp._id
              );
              const isTopUpNew = moment(topUp.createdAt).isSame(
                new Date(),
                "day"
              );
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
              const topUpData = getTopUps.find(
                (item) => item._id == topUp.topUpId
              );
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
            const bulkInsert = await PointsReceives.bulkWrite(toUpdate.flat());
            res.json(bulkInsert);
          } else {
            res.json({});
          }
        } else {
          res.json("No products has been saved");
        }
      } catch ({ message: errMessage }) {
        const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
        res.status(500).json(message);
      }
    } else {
      res.status(500).json("Required values are missing");
    }
  } else {
    res.status(403).json("Unauthorize collection of points receive");
  }
};

module.exports = {};
