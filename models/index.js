const Admin = require("../models/Admin");
const Brand = require("./Brand");
const Coupon = require("./Coupon");
const Counters = require("../models/Counters");
const Customer = require("./Customer");
const CustomerWallet = require("./CustomerWallet");
const PartnerWallet = require("./PartnerWallet");
const Invoice = require("./Invoice");
const Order = require("./Order");
const Partner = require("./Partner");
const Model = require("./Model");
const Product_Service = require("./Product_Service");
const partnerReviews = require("./partnerReviews");
const category = require("./category");
const Features = require("./Features");
const WalletTransaction = require("./WalletTransaction");
const SystemInfo = require("./SystemInfo");


const Notification = require("./Notification");
const Feedback = require("./feedback");
const orderMetaData = require("./OrderMetadata");



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
  WalletTransaction,
  Features,
  CustomerWallet,
  Feedback,
  Notification,
  SystemInfo,
  orderMetaData,
  PartnerWallet
};
