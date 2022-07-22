const sdk = require('api')('@cashfreedocs-new/v2#1224ti1hl4o0uyhs');
// const Cashfree = require("cashfree-sdk");
const orderTransactionModel = require('../../models/Ordertransaction');

class Payment {
    constructor() {
        this.APPID = process.env.CASHFREE_APP_ID;
        this.APPSECRET = process.env.CASHFREE_APP_SECRET;
        this.ENV = "TEST";
        this.paymentMethods = ["card", "upi", "app"];
    }

    async createCustomerOrder(data) {
        try {
            const resp = await sdk.CreateOrder({
                customer_details: {
                    customer_id: data.customerid,
                    customer_email: data.email,
                    customer_phone: data.phone
                },
                order_meta: {
                    notify_url: "http://51d2-103-159-43-182.ngrok.io/customerpayment/verifypayment"
                },
                order_id: data.OrderId,
                order_amount: data.Amount,
                order_currency: 'INR'
            }, {
                'x-client-id': this.APPID,
                'x-client-secret': this.APPSECRET,
                'x-api-version': '2022-01-01'
            })

            const newTransaction = new orderTransactionModel(resp);
            await newTransaction.save();

            console.log("resp", resp);
            return resp;
        } catch (error) {
            console.log(error);
            throw new Error("Couldn't Create the Order transaction")
        }
    }

    async initializeOrderPay(order_token, method, paymentTypeObj) {
        try {
            sdk.OrderPay({
                payment_method: {
                    paymentTypeObj
                },
                order_token
            });
        } catch (error) {
            console.log(error);
            throw new Error("Couldn't process the payment try again")
        }
    }

    async verifyPaymentSignature(payload) {
        // return Cashfree.Payouts.VerifySignature(payload, sign) // returns true or false
    }

    async createTranssaction(data) {
        try {
            const newTrassaction = new orderTransactionModel(data);
            const resp = await newTrassaction.save();
        } catch (error) {
            throw new Error(error);
        }
    }

    async updateOrderTranssaction() { }


}


module.exports = new Payment();