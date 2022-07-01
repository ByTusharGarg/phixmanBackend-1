const Admin = require("../models/Admin");
const Brand = require("./Brand");
const Coupon = require("./Coupon");
const Counters = require("../models/Counters");
const Customer = require("./Customer");
const Invoice = require("./Invoice");
const Order = require("./Order");
const Partner = require("./Partner");
const Model = require("./Model");
const Product_Service = require("./Product_Service");
const partnerReviews = require("./partnerReviews");
const category = require("./category");
const Wallet = require("./Wallet");
const WalletTransaction = require("./WalletTransaction");




module.exports = {
  Admin,
  Brand,
  Counters,
  Coupon,
  Customer,
  Invoice,
  Order,
  Partner,
  Model,
  category,
  Product_Service,
  partnerReviews,
  Wallet,
  WalletTransaction,
};
