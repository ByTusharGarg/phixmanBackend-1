const { invoiceTypesList, invoiceTypes } = require("../../enums/invoiceTypes");
const Invoice = require("../../models/Invoice");

class InvoicesController {
  async createInvoice(
    date,
    taxPayer,
    type,
    claim,
    order,
    customer,
    partner,
    vendor,
    items,
    bookingAmt,
    estAmt,
    discount,
    promo,
    tax
  ) {
    try {
      if (!invoiceTypesList.includes(type)) {
        throw new Error("invalid invoice type");
      }
      let ob;
      if (
        type === invoiceTypes.ORDER_PART_A ||
        type === invoiceTypes.ORDER_PART_B
      ) {
        ob = {
          date,
          taxPayer,
          order,
          type,
          customer,
          partner,
          items,
          bookingAmt,
          estAmt,
          discount,
          promo,
          tax,
        };
      }

      if (type === invoiceTypes.CLAIM_INVOICE) {
        ob = {
          date,
          taxPayer,
          claim,
          type,
          customer,
          partner,
          vendor,
          items,
          bookingAmt,
          estAmt,
          discount,
          promo,
          tax,
        };
      }
      if (type === invoiceTypes.LEAD_BOUGHT_INVOICE) {
        ob = {
          date,
          taxPayer,
          order,
          type,
          partner,
          items,
          bookingAmt,
          estAmt,
          discount,
          promo,
          tax,
        };
      }
      let invoice = await Invoice.create(ob);
      return invoice;
    } catch (error) {
      throw new Error("error creating and invoice");
    }
  }
}

module.exports = new InvoicesController();
