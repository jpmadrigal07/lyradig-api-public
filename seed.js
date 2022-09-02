const Users = require("./models/users");
const PricePoints = require("./models/pricePoints");
const TopUps = require("./models/topUps");
const Transactions = require("./models/transactions");
const moment = require("moment");

const startSeeding = async () => {
  const getAllUser = await Users.find({});
  if (!getAllUser || getAllUser.length === 0) {
    const newAdmin = new Users({
      email: "admin@gmail.com",
      phoneNumber: "+639123456789",
      password:
        process.env.NODE_ENV === "production"
          ? "U2FsdGVkX18IGi6SuHMWp7Cra1nEhnESbVmnepnt6QA="
          : "U2FsdGVkX1/uXaieRwpZx/V0jfnMbs05yjpx3WuN5Vg=",
      firstName: "Admin",
      lastName: "Admin",
      userType: "Admin",
      referralCode: "Q6fbUVyAjB",
    });
    const saveAdmin = await newAdmin.save();
    if (saveAdmin) {
      console.log("Default admin account was created");
    }
  }
  const getAllPricePoints = await PricePoints.find({});
  if (!getAllPricePoints || getAllPricePoints.length === 0) {
    const insertDefaultPricePoints = await PricePoints.insertMany([
      { price: 1000, points: 50 },
      { price: 1500, points: 75 },
      { price: 2000, points: 100 },
      { price: 3000, points: 150 },
      { price: 4000, points: 200 },
      { price: 5000, points: 250 },
      { price: 10000, points: 500 },
    ]);
    if (insertDefaultPricePoints) {
      console.log("Default price points was created");
      const getUser = await Users.find({ userType: "User" });
      if (!getUser || getUser.length === 0) {
        const newUser = new Users({
          email: "user@gmail.com",
          phoneNumber: "+639234567891",
          password:
            process.env.NODE_ENV === "production"
              ? "U2FsdGVkX1+S700YwTcKJ+Q46sQDxPCvoWJEv5cyhlA="
              : "U2FsdGVkX197v6a43n5UXUD1Bz+aaylxgyEM7nVgnuo=",
          firstName: "Test",
          lastName: "User",
          userType: "User",
          referralCode: "jhP9hnwNiw",
        });
        const saveUser = await newUser.save();
        if (saveUser) {
          console.log("Test user account was created");
          const getAdmin = await Users.find({ userType: "Admin" });
          const newTopUp = new TopUps({
            userId: saveUser._id,
            staffId: getAdmin[0]._id,
            pricePoints: insertDefaultPricePoints[1]._id,
            referenceNumber: "TESTREFERENCE123",
            status: "Approved",
            createdAt: moment().subtract(3, "days"),
          });
          const saveTopUp = await newTopUp.save();
          if (saveTopUp) {
            console.log("Test user top up was created");
            const insertTransactions = await Transactions.insertMany([
              {
                userId: saveUser._id,
                amount: 75,
                type: "Top up",
                status: "Submitted",
                createdAt: moment().subtract(3, "days"),
              },
              {
                userId: saveUser._id,
                amount: 75,
                type: "Top up",
                status: "Approved",
                createdAt: moment().subtract(3, "days"),
              },
            ]);
            if (insertTransactions) {
              console.log("Transactions was created");
            }
          }
        }
      }
    }
  }
};

startSeeding();
