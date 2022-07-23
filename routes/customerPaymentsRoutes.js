const Payment = require('../libs/payments/Payment');
const transsactioModel = require('../models/Ordertransaction');
const orderModel = require('../models/Order');
const checkCustomer = require('../middleware/AuthCustomer');
const { Customer } = require('../models');
const { body } = require("express-validator");
const shortid = require('shortid');
const { rejectBadRequests } = require('../middleware');

const router = require("express").Router();

const paymentObjectValidator = [
    body("OrderId")
        .notEmpty()
        .withMessage("OrderId number cannot be empty")
        .isString()
        .withMessage("OrderId number should be string"),
];

router.post("/payment", paymentObjectValidator, rejectBadRequests, checkCustomer, async (req, res) => {
    const { OrderId, payment_method } = req.body;

    const tempid = shortid.generate().split("-")[0];
    const carhfreeOrderId = `${OrderId}-${tempid}`;
    const paymentMethod = Object.keys(payment_method)[0];

    try {
        const isOrderExist = await orderModel.findOne({ OrderId });
        const customer = await Customer.findByIdAndUpdate(req.Customer._id);

        if (isOrderExist) {
            if (isOrderExist.PaymentStatus !== "PENDING") {
                return res.status(500).json({ message: "Payment can't be initialized" });
            } else {
                let paymentObj = await Payment.createCustomerOrder({ customerid: customer._id, email: customer.email, phone: customer.phone, OrderId: carhfreeOrderId, Amount: isOrderExist.OrderDetails.Amount });

                // initialized the payment methods
                const initiateObj = await Payment.initializeOrderPay(paymentObj['order_token'], paymentMethod, payment_method);

                // console.log(initiateObj);
                await transsactioModel.findByIdAndUpdate(paymentObj._id, { payment: initiateObj }, { new: true });

                const transsactionresp = {
                    order_id: paymentObj.order_id,
                    transsactionId: paymentObj._id,
                    paymentMethod: paymentMethod
                }

                return res.status(200).json({ message: "transsaction initialized successfully", transsactionresp });
            }
        } else {
            return res.status(500).json({ message: "order Id is incorrect" });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
});



router.post("/cardVerification/otp", async (req, res) => {
    const { transsactionId, otp, operation } = req.body;
    if (!transsactionId) {
        return res.status(500).json({ message: "transaction id required" });
    }

    try {
        const fetchTransactions = await transsactioModel.findById(transsactionId);

        if (fetchTransactions || !fetchTransactions.payment) {
            return res.status(500).json({ message: "NO transaction found or incorect id" });
        }

        const resp = await payment.authenticatePayment(operation, fetchTransactions.payment.cf_payment_id, otp);

        return res.status(200).json({ message: "transsaction successfully", transsactionId });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

router.post("/verifypayment", async (req, res) => {
    console.log(req.headers);
    let signaturePayload = req.headers['x-cashfree-timestamp'] + req.headers['x-cashfree-signature'];
    console.log(req.body.data);

    const { customer_details, order, payment } = req.body.data;

    let finalpayload = req.body.data;
    finalpayload['signature'] = signaturePayload;

    try {
        // const isAuthenticResponse = await Payment.verifyPaymentSignature(finalpayload);
        // console.log(isAuthenticResponse);


        // const isOrderExistInTxn = await transsactioModel.findOne({ order_id: order._order_id, customer_details: { customer_id: order.customer_id } });
        // const isOrderExist = await orderModel.findOne({ order_id: order._order_id });

        // if (isOrderExistInTxn && isOrderExist) {
        //     isOrderExist.payment = order.payment;
        //     isOrderExist.type = order.type;
        //     isOrderExist.event_time = order.event_time;
        //     isOrderExist.payment = order.payment;
        //     isOrderExist.Desc = "Payment successfully completed";
        // }
        // await isOrderExist.save();
        return res.status(200);
    } catch (error) {
        console.log(error);
        throw new Error("Error encountered while verifying payment")
    }
});


module.exports = router;