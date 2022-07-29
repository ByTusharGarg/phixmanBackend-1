const sdk = require('api')('@cashfreedocs-new/v2#1224ti1hl4o0uyhs');
// const Cashfree = require("cashfree-sdk");
const orderTransactionModel = require('../../models/Ordertransaction');
const ordersModel = require('../../models/Order');
const { acceptedPaymentMethods, transsactionStatus, orderStatusTypes, paymentStatus } = require('../../enums/types');
const axios = require('axios').default;


class Payment {
    constructor() {
        this.APPID = process.env.CASHFREE_APP_ID;
        this.APPSECRET = process.env.CASHFREE_APP_SECRET;
        this.ENV = "TEST";
    }

    async createCustomerOrder(data) {
        try {
            const resp = await sdk.CreateOrder({
                customer_details: {
                    customer_id: data.customerid,
                    customer_email: data.email,
                    customer_phone: data.phone
                },
                order_id: data.OrderId,
                order_amount: data.Amount,
                order_currency: 'INR'
            }, {
                'x-client-id': this.APPID,
                'x-client-secret': this.APPSECRET,
                'x-api-version': '2022-01-01'
            })

            const existingOrderId = data.OrderId.split("-")[0];

            const newTransaction = new orderTransactionModel({ ...resp, order_id: existingOrderId, cashfreeOrderId: data.OrderId });
            await newTransaction.save();

            const isorderExist = await ordersModel.findOne({ OrderId: existingOrderId });

            isorderExist.TxnId.push(newTransaction._id);

            await isorderExist.save();

            return newTransaction;
        } catch (error) {
            console.log(error);
            throw new Error("Couldn't Create the Order transaction")
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
                    ...paymentTypeObj
                },
                order_token
            });
            return resp;
        } catch (error) {
            console.log(error);
            throw new Error("Couldn't process the payment try again")
        }
    }

    async getOrders(order_id) {
        if (!order_id) {
            throw new Error("order_id required");
        }

        try {
            const resp = await sdk.GetOrder({
                order_id,
                'x-client-id': this.APPID,
                'x-client-secret': this.APPSECRET,
                'x-api-version': '2022-01-01'
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
            const resp = axios.post(`https://sandbox.cashfree.com/pg/orders/pay/authenticate/${paymentId}`, {
                action: operation,
                otp: otp
            })

            return resp;
        } catch (error) {
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
                await ordersModel.findOneAndUpdate({ OrderId: orderId }, { PaymentStatus: paymentStatus[0], Status: orderStatusTypes[1], PendingAmount: leftAmount });
            } else {
                await ordersModel.findOneAndUpdate({ OrderId: orderId }, { PaymentStatus: paymentStatus[2], Status: orderStatusTypes[1], PendingAmount: leftAmount });
            }

            return true;
        } catch (error) {
            throw new Error(error);
        }
    }

    async markTranssactionSuccess(transactionId) {
        try {
            const resp = await orderTransactionModel.findByIdAndUpdate(transactionId, { payment_status: transsactionStatus[0], order_status: "PAID" });
        } catch (error) {
            throw new Error(error);
        }
    }


}


module.exports = new Payment();