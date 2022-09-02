const { API_ROOT } = require("../constants");
const UsersRoute = require("./users");
const ProductsRoute = require("./products");
const PointsReceivesRoute = require("./pointsReceives");
const PricePointsRoute = require("./pricePoints");
const ReferralsRoute = require("./referrals");
const ReferralTopUpsRoute = require("./referralTopUps");
const TopUpsRoute = require("./topUps");
const WithdrawsRoute = require("./withdraws");
const TransactionsRoute = require("./transactions");

module.exports = function (app) {
  app.use(`${API_ROOT}/users`, UsersRoute);
  app.use(`${API_ROOT}/products`, ProductsRoute);
  app.use(`${API_ROOT}/pointsReceives`, PointsReceivesRoute);
  app.use(`${API_ROOT}/pricePoints`, PricePointsRoute);
  app.use(`${API_ROOT}/referrals`, ReferralsRoute);
  app.use(`${API_ROOT}/referralTopUps`, ReferralTopUpsRoute);
  app.use(`${API_ROOT}/topUps`, TopUpsRoute);
  app.use(`${API_ROOT}/withdraws`, WithdrawsRoute);
  app.use(`${API_ROOT}/transactions`, TransactionsRoute);
};
