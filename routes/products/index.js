const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("./controller");

router.get("/", getAllProducts);
router.post("/", addProduct);
router.put("/", updateProduct);
router.delete("/", deleteProduct);

module.exports = router;
