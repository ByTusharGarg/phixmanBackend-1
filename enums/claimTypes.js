const { CompletedPartFilterSensitiveLog } = require("@aws-sdk/client-s3");

const claimTypesList = ["CUSTOMER_RAISED_CLAIM", "VENDOR_RAISED_CLAIM"];
const claimTypes = {
  CUSTOMER: "CUSTOMER_RAISED_CLAIM",
  VENDOR: "VENDOR_RAISED_CLAIM",
}; 

const claimT = ["complaint", "warranty", "installation", "repair", "delivery"]

module.exports = { claimTypesList, claimTypes, claimT };


//Complaint,,,warranty,,,installation,,,repair,,,delivery--delivery add--->customeradd,pickup-->new ad
