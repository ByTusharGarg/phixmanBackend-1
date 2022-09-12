const genderTypes = ["male", "female", "non-binary"];
const userStatusTypes = ["active", "inactive"];
const partnerTypes = ["store", "individual","sub-provider"];
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
  "InRepair",
  "completed",
  "Cancelled",
  "Reshedulled",
];
const serviceTypes = [];
const paymentModeTypes = ["cod", "online"];
const transsactionTypes = ["debit", "credit"];
const transsactionStatus = ["successful", "pending", "failed"];
const roles = ["customer", "partner", "order"];
const paymentStatus = ["SUCCESS", "PENDING", "PARTIAL_COMPLETED", "FAILED"];
const acceptedPaymentMethods = ["card", "upi", "app"];
const transsactionUser = ["partner", "customer"];
const offerPromoType = ["flat", "upto"];
const coupenUserType = ["PARTNER", "CUSTOMER"];

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
};
