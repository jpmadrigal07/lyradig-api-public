module.exports = {
  mongoURI: process.env.MONGO_URI,
  encryptKey: process.env.ENCRYPT_KEY,
  signKey: process.env.SIGN_KEY,
  appUrl: process.env.APP_URL ? process.env.APP_URL.split(",") : [],
  pointsCollectionInterval: process.env.POINTS_COLLECTION_INTERVAL,
};
