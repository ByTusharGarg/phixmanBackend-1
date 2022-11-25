const genderTypes = ["male", "female", "non-binary"];
const userStatusTypes = ["active", "inactive"];
const partnerTypes = ["store", "individual", "sub-provider", "specialist"];
const partnerStatusTypes = ["active", "inactive"];
const storeStatusTypes = ["active", "inactive"];
const categoryTypes = [
  "Home service",
  "Store service",
  "Auto care",
  "Neha’s personal care",
];
const orderTypes = ["Visit Store", "Home Visit", "Pick & Drop"];
const orderStatusTypes = [
  "Initial",
  "Requested",
  "Accepted",
  "pickup",
  "InRepair",
  "completed",
  "delivered",
  "Cancelled",
  "Reshedulled",
];
const orderStatusTypesObj = {
  Initial: "Initial",
  Requested: "Requested",
  Accepted: "Accepted",
  pickup: "pickup",
  InRepair: "InRepair",
  completed: "completed",
  delivered: "delivered",
  Cancelled: "Cancelled",
  Reshedulled: "Reshedulled"
};

const payoutStatusTypes = [
  null,
  "WITHDRAW",
  "INPROGRESS",
  "SUCCESS",
  "FAILED",
  "NOT_ALLOWED"
];


const payoutStatusTypesObject = {
  WITHDRAW: "WITHDRAW",
  INPROGRESS: "INPROGRESS",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  NOT_ALLOWED:"NOT_ALLOWED"
}

const serviceTypes = [];
const paymentModeTypes = ["cod", "online"];
const transsactionTypes = ["debit", "credit"];
const transsactionStatus = ["successful", "pending", "failed"];
const roles = ["customer", "partner", "order"];
const paymentStatus = ["SUCCESS", "PENDING", "PARTIAL_COMPLETED", "FAILED", "REFUND"];
const acceptedPaymentMethods = ["card", "upi", "app"];
const transsactionUser = ["partner", "customer"];
const offerPromoType = ["flat", "upto"];
const coupenUserType = ["PARTNER", "CUSTOMER"];

const panalityEnnum = ["CANCEL"];

const payoutPaymentStatus = ["AWAITED", "SUCCESS", "FAILED", "INPROGRESS"];


const paymentStatusObject = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  PARTIAL_COMPLETED: "PARTIAL_COMPLETED",
  FAILED: "FAILED",
  REFUND: "REFUND"
}

module.exports = {
  categoryTypes,
  genderTypes,
  userStatusTypes,
  partnerTypes,
  partnerStatusTypes,
  storeStatusTypes,
  orderTypes,
  orderStatusTypes,
  serviceTypes,
  paymentModeTypes,
  transsactionTypes,
  transsactionStatus,
  roles,
  paymentStatus,
  acceptedPaymentMethods,
  transsactionUser,
  offerPromoType,
  coupenUserType,
  orderStatusTypesObj,
  panalityEnnum,
  paymentStatusObject,
  payoutPaymentStatus,
  payoutStatusTypes,
  payoutStatusTypesObject
};
