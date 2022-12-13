const claimTypesList = ["CUSTOMER_RAISED_CLAIM", "VENDOR_RAISED_CLAIM"];
const claimTypes = {
  CUSTOMER: "CUSTOMER_RAISED_CLAIM",
  VENDOR: "VENDOR_RAISED_CLAIM",
};

const claimT = ["complaint", "warranty", "installation", "repair", "delivery"];

const claimStatus = {
  requested: "REQUESTED",
  approved: "APPROVED",
  inProgress: "IN-PROGRESS",
  delivered: "DELIVERED",
  rejected: "REJECTED",
};

const claimStatusList = [
  "REQUESTED",
  "APPROVED",
  "IN-PROGRESS",
  "DELIVERED",
  "REJECTED"
];

const paymentClaimCycle = [
  "PAYMENT_REQUESTED",
  "PAYMENT_APPROVED",
  "PAYMENT_PENDING",
  "PAYMENT_INNPROGRESS",
  "PAYMENT_COMPLETED"
];


module.exports = {
  claimTypesList,
  claimTypes,
  claimStatus,
  claimStatusList,
  claimT,
  paymentClaimCycle
};
