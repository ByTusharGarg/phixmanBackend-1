const genderTypes = ["male", "female", "non-binary"];
const userStatusTypes = ["active", "inactive"];
const partnerTypes = ["store", "individual"];
const partnerStatusTypes = ["active", "inactive"];
const storeStatusTypes = ["active", "inactive"];
const orderTypes = ["InStore", "Home", "PickUpDrop"];
const orderStatusTypes = [
  "Initial",
  "Requested",
  "Accepted",
  "InRepair",
  "completed",
  "Cancelled",
];
const serviceTypes = [];
const paymentModeTypes = ["cod","online"];
const transsactionTypes = ["debit", "credit"];
const transsactionStatus = ["successful", "pending", "failed"];
const roles = ["customer","partner","order"]
const paymentStatus = ["SUCCESS", "PENDING", "PARTIAL_COMPLETED","FAILED"];
const acceptedPaymentMethods = ["card", "upi", "app"];
const transsactionUser = ["partner","customer"];


module.exports = {
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
};
