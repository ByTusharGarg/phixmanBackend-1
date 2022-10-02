const sdk = require("api")("@cashfreedocs-new/v2#1224ti1hl4o0uyhs");
const orderTransactionModel = require("../../models/Ordertransaction");
const ordersModel = require("../../models/Order");
const {
  acceptedPaymentMethods,
  transsactionStatus,
  orderStatusTypes,
  paymentStatus,
} = require("../../enums/types");
const { WalletTransaction } = require("../../models");
const {
  getPartnerWallet,
  updateWallletTransactionByTransactionId,
  updatePartnerWallet,
} = require("../../services/Wallet");
const axios = require("axios").default;

let casrfreeUrlLinks =
  process.env.CASH_FREE_MODE === "Test"
    ? process.env.CASHFREE_GATEWAY_DEV_URL
    : process.env.CASHFREE_GATEWAY_PROD_URL;
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

      const newTransaction = new orderTransactionModel({
        ...resp,
        order_id: existingOrderId,
        cashfreeOrderId: data.OrderId,
      });
      await newTransaction.save();

      await ordersModel.findOneAndUpdate(
        { OrderId: existingOrderId },
        { $push: { TxnId: newTransaction._id } },
        { upsert: true, new: true }
      );

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
      console.log(resp);
      let payment = await axios.get(resp?.payments?.url, {
        headers: {
          "x-api-version": "2022-01-01",
          "x-client-id": this.APPID,
          "x-client-secret": this.APPSECRET,
        },
      });

      let transaction = await orderTransactionModel.findOneAndUpdate(
        { order_id },
        { payment_status: payment.data[0].payment_status },
        { new: true }
      );
      return transaction;
    } catch (error) {
      console.log(error);
      throw new Error("Couldn't verify order");
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
            Status: orderStatusTypes[1],
            PendingAmount: leftAmount,
          }
        );
      } else {
        await ordersModel.findOneAndUpdate(
          { OrderId: orderId },
          {
            PaymentStatus: paymentStatus[2],
            Status: orderStatusTypes[1],
            PendingAmount: leftAmount,
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
}

module.exports = new Payment();
