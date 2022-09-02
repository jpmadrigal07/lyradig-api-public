const cron = require("node-cron");
const { collectPoints } = require("./collectPoints");
const Users = require("../models/users");
const keys = require("../config/keys");

const every = keys.pointsCollectionInterval;

const initAllUserPointsCollection = async () => {
  const getPointsReceivedToday = await Users.find({
    deletedAt: {
      $exists: false,
    },
    blockedAt: {
      $exists: false,
    },
    userType: "User",
  });
  if (getPointsReceivedToday && getPointsReceivedToday.length > 0) {
    getPointsReceivedToday.forEach((data) => {
      cron.schedule(every, () => {
        collectPoints(data._id);
      });
    });
  }
  console.log("POINTS COLLECTION: Started");
};

const initUserPointsCollection = (userId) => {
  cron.schedule(every, () => {
    collectPoints(userId);
  });
  console.log("User points collection job is initialized for " + userId);
};

module.exports = {
  initAllUserPointsCollection,
  initUserPointsCollection,
};
