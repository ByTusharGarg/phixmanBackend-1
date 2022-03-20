const Admin = require("../models/Admin");
const Brand = require("./Brand");
const Coupon = require("./Coupon");
const Counters = require("../models/Counters");
const Customer = require("./Customer");
const Invoice = require("./Invoice");
const Order = require("./Order");
const Partner = require("./Partner");
const Product = require("./Product");
const Product_Service = require("./Product_Service");
const Store = require("./Store");
const partnerReviews = require("./partnerReviews");
const ProductType = require("./ProductType");

module.exports = {
  Admin,
  Brand,
  Counters,
  Coupon,
  Customer,
  Invoice,
  Order,
  Partner,
  Product,
  ProductType,
  Product_Service,
  Store,
  partnerReviews,
};
