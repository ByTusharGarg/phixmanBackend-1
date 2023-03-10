const Admin = require("../models/Admin");

const Brand = require("./Brand");

const Coupon = require("./Coupon");
const Counters = require("./Counters");
const Country = require("./Country");
const Customer = require("./Customer");
const CustomerWallet = require("./CustomerWallet");
const category = require("./category");
const City = require("./city");

const Features = require("./Features");
const Feedback = require("./feedback");

const Model = require("./Model");

const Notification = require("./Notification");

const Order = require("./Order");
const orderMetaData = require("./OrderMetadata");

const PartnerWallet = require("./PartnerWallet");
const Product_Service = require("./Product_Service");
const partnerReviews = require("./partnerReviews");
const Partner = require("./Partner");

const State = require("./State");
const SystemInfo = require("./SystemInfo");
const SubCategory = require("./SubCategory");

const WalletTransaction = require("./WalletTransaction");
const orderTransaction = require("./Ordertransaction");

const ClaimRequest = require("./ClaimRequest")

const refundModel = require("./refund.model");

const Zone = require("./Zone");

const Invoice = require("./Invoice")

const Vendor = require("./Vendor")

module.exports = {
  Admin,
  Brand,
  CustomerWallet,
  Counters,
  Coupon,
  Customer,
  category,
  Country,
  City,
  Features,
  Feedback,
  Model,
  Notification,
  Order,
  orderMetaData,
  PartnerWallet,
  Partner,
  Product_Service,
  partnerReviews,
  State,
  SystemInfo,
  SubCategory,
  WalletTransaction,
  Zone,
  orderTransaction,
  ClaimRequest,
  refundModel,
  Invoice,
  Vendor
};
