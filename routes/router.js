const indexRoutes = require("./indexRoutes");
const adminRoutes = require("./adminRoutes");
const customerRoutes = require("./customerRoutes");
const partnerRoutes = require("./partnerRoutes");
const orderRoutes = require("./orderRoutes");
const walletRoutes = require("./walletRoute");

const customerPaymentRoutes = require("./customerPaymentsRoutes");
const coupenRoutes = require("./coupenRoutes");



module.exports = {
  indexRoutes,
  adminRoutes,
  customerRoutes,
  partnerRoutes,
  orderRoutes,
  walletRoutes,
  customerPaymentRoutes,
  coupenRoutes
};
