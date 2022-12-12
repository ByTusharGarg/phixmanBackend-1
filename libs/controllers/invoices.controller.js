const { claimTypes } = require("../../enums/claimTypes");
const { invoiceTypesList, invoiceTypes } = require("../../enums/invoiceTypes");
const { Partner, ClaimRequest, Order, Customer, Vendor } = require("../../models");
const Invoice = require("../../models/Invoice");

class InvoicesController {
  async createInvoice(
    invoiveType,
    claimOrOrderId,
    customer,
    partner,
    items,
    bookingAmt,
    estAmt,
    discount,
    tax,
    vendor,
    promo
  ) {
    try {
      if (!invoiceTypesList.includes(invoiveType)) {
        throw new Error("invalid invoice type");
      }
      const isPartner = await Partner.findById(partner);
      if (!isPartner) {
        throw new Error("partner not found");
      }
      const isCustomer = await Customer.findById(customer);
      if (!isCustomer) {
        throw new Error("customer not found");
      }
      let ob = {
        type: invoiveType,
        customer,
        partner,
        bookingAmt,
        estAmt,
        tax,
      };
      if (isPartner.gstCertificate && isPartner.gstCertificateNo) {
        ob.taxPayer = partner;
        ob.isGstPaid = true;
      }
      if (
        invoiveType === invoiceTypes.ORDER_PART_A ||
        invoiveType === invoiceTypes.ORDER_PART_B ||
        invoiveType === invoiceTypes.LEAD_BOUGHT_INVOICE
      ) {
        const isOrder = await Order.findById(claimOrOrderId);
        if (!isOrder) {
          throw new Error("order not found");
        }
        ob.order = claimOrOrderId;
        ob.items = items;
        ob.promo = promo;
        ob.discount = discount;
        ob.date = isOrder?.createdAt;
      }

      if (invoiveType === invoiceTypes.CLAIM_INVOICE) {
        const isClaim = await ClaimRequest.findById(claimOrOrderId);
        if (!isClaim) {
          throw new Error("claim not found");
        }
        ob.claim = claimOrOrderId;
        ob.date = isClaim?.createdAt;
        if (isClaim.claimType === claimTypes.VENDOR) {
          const isVendor = await Vendor.findById(vendor);
          if (!isVendor) {
            throw new Error("vendor not found");
          }
          ob.vendor = vendor;
        }
      }

      return Invoice.create(ob);
    } catch (error) {
      throw new Error("error creating and invoice");
    }
  }
}

module.exports = new InvoicesController();
