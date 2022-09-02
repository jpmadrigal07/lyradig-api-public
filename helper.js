const Users = require("./models/users");
const {
  UNKNOWN_ERROR_OCCURRED,
  HIGH_LOAD_TRAFFIC_ERROR,
} = require("./constants");
const keys = require("./config/keys");
const jwt = require("jsonwebtoken");
const osu = require("node-os-utils");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message:
    "We can't handle your request right now, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

const checkSystemHealth = async (req, res, next) => {
  // add this process to cron jobs
  const cpu = osu.cpu;
  const mem = osu.mem;
  try {
    const cpuUsage = await cpu.usage();
    const memUsage = await mem.info();
    if (cpuUsage > 3) {
      throw new Error(HIGH_LOAD_TRAFFIC_ERROR);
    }
    if (memUsage > 3) {
      throw new Error(HIGH_LOAD_TRAFFIC_ERROR);
    }
    next();
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    if (message === HIGH_LOAD_TRAFFIC_ERROR) {
      res.status(503).json(message);
    } else {
      res.status(500).json(message);
    }
  }
};

const isUserLoggedIn = async (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    try {
      const { email, phoneNumber } = jwt.verify(bearerToken, keys.signKey);
      const user = await Users.findOne({ email, phoneNumber });
      if (user && user.deletedAt) {
        throw new Error("We cannot find your account in our system");
      }
      if (user && user.blockedAt) {
        throw new Error(
          "Your account was banned, all actions and requested data was prohibited"
        );
      }
      res.locals.user = user;
      next();
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      if (message === "jwt malformed") {
        res.status(401).json("Invalid authentication credentials");
      } else if (message === "jwt expired") {
        res.status(403).json("Authentication is expired, please login again");
      } else {
        res.status(403).json(message);
      }
    }
  } else {
    res.status(401).json(`You are not authorized to perform this action`);
  }
};

const isUserStaff = async (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    try {
      const { email, userType } = jwt.verify(bearerToken, keys.signKey);
      const user = await Users.findOne({ email });
      if (!user) {
        throw new Error("No account found");
      }
      if (userType !== "Staff") {
        throw new Error("You are not authorized to perform this action");
      }
      next();
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(403).json(`Authorize Request Error: ${message}`);
    }
  } else {
    res.status(401).json(`You are not authorized to perform this action`);
  }
};

const isUserAdmin = async (req, res, next) => {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    try {
      const { email, userType } = jwt.verify(bearerToken, keys.signKey);
      const user = await Users.findOne({ email });
      if (!user) {
        throw new Error("No account found");
      }
      if (userType !== "Admin") {
        throw new Error("You are not authorized to perform this action");
      }
      next();
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(403).json(`Authorize Request Error: ${message}`);
    }
  } else {
    res.status(403).json(`You are not authorized to perform this action`);
  }
};

module.exports = {
  isUserLoggedIn,
  isUserStaff,
  isUserAdmin,
  checkSystemHealth,
  limiter,
};
