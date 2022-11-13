// const sdk = require("api")("@cashfreedocs-new/v2#1224ti1hl4o0uyhs");
const sdk = require('api')('@cashfreedocs-new/v2#5qon17l8k4gqrl');


const orderTransactionModel = require("../../models/Ordertransaction");
const refundModel = require("../../models/refund.model");

const ordersModel = require("../../models/Order");
const {
  acceptedPaymentMethods,
  transsactionStatus,
  orderStatusTypes,
  paymentStatus,
  orderStatusTypesObj,
} = require("../../enums/types");
const { WalletTransaction } = require("../../models");
const {
  getPartnerWallet,
  updateWallletTransactionByTransactionId,
  updatePartnerWallet,
} = require("../../services/Wallet");
const commonFunction = require('../../utils/commonFunction');
const axios = require("axios").default;

let casrfreeUrlLinks =
  process.env.CASH_FREE_MODE === "Test"
    ? process.env.CASHFREE_GATEWAY_DEV_URL
    : process.env.CASHFREE_GATEWAY_PROD_URL;

// sdk.server(casrfreeUrlLinks);
sdk.server(casrfreeUrlLinks);

class Payment {
  constructor() {
    this.APPID = process.env.CASHFREE_APP_ID;
    this.APPSECRET = process.env.CASHFREE_APP_SECRET;
    this.ENV = process.env.CASH_FREE_MODE;
    this.casrfreeUrl = casrfreeUrlLinks;
  }

  async createCustomerOrder(data) {
    try {
      const resp = await sdk.CreateOrder(
        {
          customer_details: {
            customer_id: data.customerid,
            customer_email: data.email,
            customer_phone: data.phone,
          },
          order_id: data.OrderId,
          order_amount: data.Amount,
          order_currency: "INR",
        },
        {
          "x-client-id": this.APPID,
          "x-client-secret": this.APPSECRET,
          "x-api-version": "2022-01-01",
        }
      );

      const existingOrderId = data.OrderId.split("-")[0];

      const newTransaction = await this.createTranssaction({
        ...resp,
        order_id: existingOrderId,
        cashfreeOrderId: data.OrderId,
      });
      await newTransaction.save();


      // this is move down to 
      // await ordersModel.findOneAndUpdate(
      //   { OrderId: existingOrderId },
      //   { $push: { TxnId: newTransaction._id } },
      //   { new: true }
      // );

      return newTransaction;
    } catch (error) {
      console.log(error);
      throw new Error("Couldn't Create the Order transaction");
    }
  }

  async verifyCustomerOrder(order_id) {
    try {
      const resp = await sdk.GetOrder({
        order_id,
        "x-api-version": "2022-01-01",
        "x-client-id": this.APPID,
        "x-client-secret": this.APPSECRET,
      });
      let payment = await axios.get(resp?.payments?.url, {
        headers: {
          "x-api-version": "2022-01-01",
          "x-client-id": this.APPID,
          "x-client-secret": this.APPSECRET,
        },
      });

      if (payment.data.length > 0) {
        let isExist = await orderTransactionModel.findOneAndUpdate({ cashfreeOrderId: order_id });

        let transaction = await orderTransactionModel.findOneAndUpdate(
          { cashfreeOrderId: order_id },
          { order_status: payment.data[0].payment_status, payment_group: payment.data[0].payment_group, payment_method: payment.data[0].payment_method, paymentverified: true },
          { new: true }
        );

        if (isExist?.paymentverified === false) {
          await this.updateOrderPaymentStatus(order_id, transaction._id);
        }
        return transaction;
      }
      throw new Error("Payment not completed yet");
    } catch (error) {
      console.log(error);
      throw new Error(error.message || "some error occurred");
    }
  }

  async initiateCreditOrder(order_id, Amount, id, email = "", phone = "") {
    try {
      const resp = await sdk.CreateOrder(
        {
          customer_details: {
            customer_id: id,
            customer_email: email,
            customer_phone: phone,
          },
          order_id: order_id,
          order_amount: Amount,
          order_currency: "INR",
        },
        {
          "x-client-id": this.APPID,
          "x-client-secret": this.APPSECRET,
          "x-api-version": "2022-01-01",
        }
      );
      const wallet = await getPartnerWallet(id);
      const walletTransaction = await WalletTransaction.create({
        tranId: order_id,
        cashfree: resp,
        transsactionUser: "partner",
        walletId: wallet?._id,
        title: "add credit request",
        transsactionType: "credit",
        status: "pending",
        reason: "",
        amount: Amount,
      });
      return walletTransaction;
    } catch (error) {
      console.log(error);
      throw new Error("Couldn't place order");
    }
  }

  async verifyCreditOrder(transaction) {
    try {
      let payment = await axios.get(transaction?.cashfree?.payments?.url, {
        headers: {
          "x-api-version": "2022-01-01",
          "x-client-id": this.APPID,
          "x-client-secret": this.APPSECRET,
        },
      });

      if (!payment?.data[0]?.payment_status) {
        return { status: "pending" };
      }
      if (payment?.data[0]?.payment_status === "SUCCESS") {
        await updatePartnerWallet(
          transaction?.cashfree?.customer_details?.customer_id,
          transaction?.amount,
          "credit"
        );
      }
      const updatedTrans = await updateWallletTransactionByTransactionId(
        transaction?.tranId,
        payment?.data[0]?.payment_status
      );
      return updatedTrans;
    } catch (error) {
      console.log(error);
      throw new Error("Couldn't verify trans");
    }
  }

  async initializeOrderPay(order_token, method, paymentTypeObj) {
    if (!acceptedPaymentMethods.includes(method)) {
      throw new Error("payments methods not supported");
    }

    if (!order_token) {
      throw new Error("order_token required");
    }

    try {
      const resp = await sdk.OrderPay({
        payment_method: {
          ...paymentTypeObj,
        },
        order_token,
      });
      return resp;
    } catch (error) {
      console.log(error);
      throw new Error("Couldn't process the payment try again");
    }
  }

  async getOrders(order_id) {
    if (!order_id) {
      throw new Error("order_id required");
    }

    try {
      const resp = await sdk.GetOrder({
        order_id,
        "x-client-id": this.APPID,
        "x-client-secret": this.APPSECRET,
        "x-api-version": "2022-01-01",
      });

      return resp;
    } catch (error) {
      throw new Error(error);
    }
  }

  async authenticatePayment(operation, paymentId, otp) {
    if (operation !== "RESEND_OTP" && operation !== "SUBMIT_OTP") {
      throw new Error("Invalid operation");
    }

    if (operation === "SUBMIT_OTP" && !otp) {
      throw new Error("Otp required");
    }

    try {
      const resp = axios.post(
        `${this.casrfreeUrl}/orders/pay/authenticate/${paymentId}`,
        {
          action: operation,
          otp: otp,
        }
      );

      return resp;
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }

  async verifyPaymentSignature(payload) {
    // return Cashfree.Payouts.VerifySignature(payload, sign) // returns true or false
  }

  async createTranssaction(data) {
    try {
      const newTrassaction = new orderTransactionModel(data);
      const resp = await newTrassaction.save();
      return resp;
    } catch (error) {
      throw new Error(error);
    }
  }

  async updateOrderPaymentStatus(orderId, transactionId) {
    try {
      const txnData = await orderTransactionModel.findById(transactionId);
      const orderData = await ordersModel.findOne({ OrderId: orderId });

      const leftAmount = orderData.PendingAmount - txnData.order_amount;

      if (leftAmount === 0) {
        await ordersModel.findOneAndUpdate(
          { OrderId: orderId },
          {
            PaymentStatus: paymentStatus[0],
            Status: orderStatusTypesObj['Requested'],
            PendingAmount: leftAmount,
            $push: { TxnId: transactionId },
            $inc: { paidamount: txnData.order_amount },
          }
        );
      } else {
        await ordersModel.findOneAndUpdate(
          { OrderId: orderId },
          {
            PaymentStatus: paymentStatus[2],
            Status: orderStatusTypesObj['Requested'],
            PendingAmount: leftAmount,
            $inc: { paidamount: txnData.order_amount }
          }
        );
      }

      return true;
    } catch (error) {
      throw new Error(error);
    }
  }

  async markTranssactionSuccess(transactionId) {
    try {
      const resp = await orderTransactionModel.findByIdAndUpdate(
        transactionId,
        { payment_status: transsactionStatus[0], order_status: "PAID" }
      );
    } catch (error) {
      throw new Error(error);
    }
  }

  async initiateRefundPayments(orderid, amount, metadata) {
    const refunId = commonFunction.genrateID("REF_");

    try {
      // const newRefund = new refundModel(metadata);
      const options = {
        method: 'POST',
        url: this.casrfreeUrl + `/orders/${orderid}/refunds`,
        headers: {
          accept: 'application/json',
          'x-client-id': this.APPID,
          'x-client-secret': this.APPSECRET,
          'x-api-version': '2022-01-01',
          'content-type': 'application/json'
        },
        data: { refund_amount: amount, refund_id: refunId }
      };

      const refundResp = await axios.request(options);

      const newRefund = new refundModel({ orderId: metadata.orderId, cashfreeOrderId: orderid, refundId: refunId, caashfreeData: refundResp.data });
      const refundDbData = await newRefund.save();

      return ordersModel.findByIdAndUpdate(metadata['orderId'], { refundId: refundDbData._id, refundStatus: refundResp.data['refund_status'], Status: orderStatusTypesObj.Cancelled });
    } catch (error) {
      throw new Error(error.response.data.message || error.message || error);
    }
  }
}

module.exports = new Payment();
