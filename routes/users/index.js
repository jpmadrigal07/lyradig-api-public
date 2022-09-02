const express = require("express");
const router = express.Router();
const { getAllUsers, addUser, updateUser, deleteUser } = require("./default");
const { auth } = require("./customPost");
const {
  verifyAuth,
  getPointsSummary,
  getPaginatedStaffs,
} = require("./customGet");
const { isUserLoggedIn, isUserStaff } = require("../../helper");
const { updatePassword } = require("./customPut");

// default
router.get("/", isUserLoggedIn, isUserStaff, getAllUsers);
router.post("/", addUser);
router.patch("/:id", isUserLoggedIn, updateUser);
router.delete("/:id", deleteUser);

// custom post
router.post("/auth", auth);

// custom get
router.get("/verifyAuth", verifyAuth);
router.get("/pointsSummary", isUserLoggedIn, getPointsSummary);
router.get("/paginated", isUserLoggedIn, getPaginatedStaffs);

// custom put
router.put("/updatePassword/:id", isUserLoggedIn, updatePassword);

module.exports = router;
