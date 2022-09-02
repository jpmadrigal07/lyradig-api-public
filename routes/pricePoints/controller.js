const PricePoints = require("../../models/pricePoints");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");

const getAllPricePoints = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllPricePoint = await PricePoints.find(condition).sort({
      price: 1,
    });
    res.json(getAllPricePoint);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addPricePoint = async (req, res, next) => {
  const { price, points } = req.body;
  if (price && points) {
    const newPricePoint = new PricePoints({
      price,
      points,
    });
    try {
      const getPricePoint = await PricePoints.find({
        price,
        points,
        deletedAt: {
          $exists: false,
        },
      });
      if (getPricePoint.length === 0) {
        const createPricePoint = await newPricePoint.save();
        res.json(createPricePoint);
      } else {
        throw new Error("Price Point name must be unique");
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(400).json(REQUIRED_VALUE_EMPTY);
  }
};

const updatePricePoint = async (req, res, next) => {
  const condition = req.body;
  if (!isEmpty(condition)) {
    try {
      const updatePricePoint = await PricePoints.findByIdAndUpdate(
        req.params.id,
        {
          $set: condition,
          updatedAt: Date.now(),
        },
        { new: true }
      );
      res.json(updatePricePoint);
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(500).json("Price Point cannot be found");
  }
};

const deletePricePoint = async (req, res, next) => {
  try {
    const getPricePoint = await PricePoints.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getPricePoint.length > 0) {
      const deletePricePoint = await PricePoints.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            deletedAt: Date.now(),
          },
        }
      );
      res.json(deletePricePoint);
    } else {
      throw new Error("Price Point is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllPricePoints,
  addPricePoint,
  updatePricePoint,
  deletePricePoint,
};
