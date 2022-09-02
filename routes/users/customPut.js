const Users = require("../../models/users");
const {
  UNKNOWN_ERROR_OCCURRED,
  REQUIRED_VALUE_EMPTY,
} = require("../../constants");
const keys = require("../../config/keys");
const CryptoJS = require("crypto-js");

const updatePassword = async (req, res, next) => {
  if (res.locals.user && String(res.locals.user._id) === req.params.id) {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    if (oldPassword && newPassword) {
      try {
        const verifyUser = await Users.findOne({
          _id: req.params.id,
          deletedAt: {
            $exists: false,
          },
        });
        const dbPasswordDecrypted = CryptoJS.AES.decrypt(
          verifyUser.password,
          keys.encryptKey
        );
        const dbPassword = dbPasswordDecrypted.toString(CryptoJS.enc.Utf8);
        if (!verifyUser || dbPassword !== oldPassword) {
          throw new Error("Wrong old password");
        }
        const newPasswordEncrypted = CryptoJS.AES.encrypt(
          newPassword,
          keys.encryptKey
        ).toString();
        const updateUser = await Users.findByIdAndUpdate(
          req.params.id,
          {
            password: newPasswordEncrypted,
            updatedAt: Date.now(),
          },
          { new: true }
        );
        res.json(updateUser);
      } catch ({ message: errMessage }) {
        const message = errMessage ? errMessage : UNKNOWN_ERROR_OCCURRED;
        res.status(500).json(message);
      }
    } else {
      res.status(500).json("Required fields are empty");
    }
  } else {
    res.status(403).json("Unauthorized action");
  }
};

module.exports = {
  updatePassword,
};
