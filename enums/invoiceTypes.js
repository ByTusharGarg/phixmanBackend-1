const invoiceTypesList = [
  "ORDER_PART_A",
    "ORDER_PART_B",
    "LEAD_BOUGHT_INVOICE",
    "CLAIM_INVOICE"
];
const invoiceTypes = {
  ORDER_PART_A: "ORDER_PART_A", //commission
  ORDER_PART_B: "ORDER_PART_B", //remaining amount
  LEAD_BOUGHT_INVOICE: "LEAD_BOUGHT_INVOICE",
  CLAIM_INVOICE: "CLAIM_INVOICE",
};

module.exports = { invoiceTypesList, invoiceTypes };
