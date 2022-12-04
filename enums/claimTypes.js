const claimTypesList = ["CUSTOMER_RAISED_CLAIM", "VENDOR_RAISED_CLAIM"];
const claimTypes = {
  CUSTOMER: "CUSTOMER_RAISED_CLAIM",
  VENDOR: "VENDOR_RAISED_CLAIM",
}; 
const claimStatus = {
  requested:"REQUESTED",
  approved:"APPROVED",
  inProgress:"IN-PROGRESS",
  delivered:"DELIVERED",
  rejected:"REJECTED"
}
const claimStatusList = [
  "REQUESTED",
  "APPROVED",
  "IN-PROGRESS",
  "DELIVERED",
  "REJECTED"
]
module.exports = { claimTypesList, claimTypes,claimStatus,claimStatusList };
