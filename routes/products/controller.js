const Products = require("../../models/products");
const isEmpty = require("lodash/isEmpty");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");

const getAllProducts = async (req, res, next) => {
  const condition = req.query.condition ? JSON.parse(req.query.condition) : {};
  if (!condition.deletedAt) {
    condition.deletedAt = {
      $exists: false,
    };
  }
  try {
    const getAllProduct = await Products.find(condition);
    res.json(getAllProduct);
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

const addProduct = async (req, res, next) => {
  const { name, level, price, additionalPrice } = req.body;
  if (name && level && price && additionalPrice) {
    const newProduct = new Products({
      name,
      level,
      price,
      additionalPrice,
    });
    try {
      const getProduct = await Products.find({
        name,
        price,
        deletedAt: {
          $exists: false,
        },
      });
      if (getProduct.length === 0) {
        const createProduct = await newProduct.save();
        res.json(createProduct);
      } else {
        throw new Error("Product name must be unique");
      }
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(400).json(REQUIRED_VALUE_EMPTY);
  }
};

const updateProduct = async (req, res, next) => {
  const condition = req.body;
  if (!isEmpty(condition)) {
    try {
      const updateProduct = await Products.findByIdAndUpdate(
        req.params.id,
        {
          $set: condition,
          updatedAt: Date.now(),
        },
        { new: true }
      );
      res.json(updateProduct);
    } catch ({ message: errMessage }) {
      const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
      res.status(500).json(message);
    }
  } else {
    res.status(500).json("Product cannot be found");
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const getProduct = await Products.find({
      _id: req.params.id,
      deletedAt: {
        $exists: false,
      },
    });
    if (getProduct.length > 0) {
      const deleteProduct = await Products.findByIdAndUpdate(req.params.id, {
        $set: {
          deletedAt: Date.now(),
        },
      });
      res.json(deleteProduct);
    } else {
      throw new Error("Product is already deleted");
    }
  } catch ({ message: errMessage }) {
    const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
    res.status(500).json(message);
  }
};

module.exports = {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
