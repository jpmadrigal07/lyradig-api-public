const PointsReceives = require("../../models/pointsReceives");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");

const getAllPointsReceives = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllPointsReceive = await PointsReceives.find(condition);
    res.json(getAllPointsReceive);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addPointsReceive = async (req, res, next) => {
  const { price, points } = req.body;
  if (price && points) {
    const newPointsReceive = new PointsReceives({
      price,
      points,
    });
    try {
      const getPointsReceive = await PointsReceives.find({
        price,
        points,
        deletedAt: {
          $exists: false,
        },
      });
      if (getPointsReceive.length === 0) {
        const createPointsReceive = await newPointsReceive.save();
        res.json(createPointsReceive);
      } else {
        throw new Error("Points Receive name must be unique");
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(400).json(REQUIRED_VALUE_EMPTY);
  }
};

const updatePointsReceive = async (req, res, next) => {
  const condition = req.body;
  if (!isEmpty(condition)) {
    try {
      const updatePointsReceive = await PointsReceives.findByIdAndUpdate(
        req.params.id,
        {
          $set: condition,
          updatedAt: Date.now(),
        },
        { new: true }
      );
      res.json(updatePointsReceive);
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(500).json("Points Receive cannot be found");
  }
};

const deletePointsReceive = async (req, res, next) => {
  try {
    const getPointsReceive = await PointsReceives.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getPointsReceive.length > 0) {
      const deletePointsReceive = await PointsReceives.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            deletedAt: Date.now(),
          },
        }
      );
      res.json(deletePointsReceive);
    } else {
      throw new Error("Points Receive is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllPointsReceives,
  addPointsReceive,
  updatePointsReceive,
  deletePointsReceive,
};
