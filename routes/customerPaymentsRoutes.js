const Payment = require('../libs/payments/Payment');
const transsactioModel = require('../models/Ordertransaction');
const orderModel = require('../models/Order');
const checkCustomer = require('../middleware/AuthCustomer');
const { Customer } = require('../models');
const { body } = require("express-validator");
const shortid = require('shortid');
const { rejectBadRequests } = require('../middleware');
const { transsactionTypes, transsactionStatus } = require('../enums/types');

const router = require("express").Router();

const paymentObjectValidator = [
    body("OrderId")
        .notEmpty()
        .withMessage("OrderId number cannot be empty")
        .isString()
        .withMessage("OrderId number should be string"),
];


/**
 * @openapi
 * /customerpayment/payment:
 *  post:
 *    summary: it's use to create Transsactions and checkout with payment options
 *    tags:
 *    - Customer Payments Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                OrderId:
 *                  type: string
 *                flag:
 *                  type: string
 *                  enum: [PENDING, PARTIAL_COMPLETED]
 *                payment_method:
 *                  type: object
 *                  properties:
 *                    card:
 *                      type: object
 *                      properties:
 *                         card_number:
 *                           type: string
 *                         card_holder_name:
 *                            type: string
 *                         card_expiry_mm:
 *                            type: string
 *                         card_expiry_yy:
 *                            type: string
 *                         card_cvv:
 *                            type: string
 *    responses:
 *      200:
 *          description: transsaction initialized successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: transsaction initialized successfully.
 *                  transsactionId:
 *                    type: string
 *                    description: The payment transaction id
 *                    example: 659659d9d2d92d92d92d9d2
 *                  paymentMethod:
 *                    type: string
 *                    description: The payment method selected by the user like card upi etc
 *                    example: 659659d9d2d92d92d92d9d2
 *      400:
 *         description: if the parameters given were invalid
 *         content:
 *           application/json:
 *             schema:
 *               required:
 *               - errors
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   description: a list of validation errors
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: object
 *                         description: the value received for the parameter
 *                       msg:
 *                         type: string
 *                         description: a message describing the validation error
 *                       param:
 *                         type: string
 *                         description: the parameter for which the validation error occurred
 *                       location:
 *                         type: string
 *                         description: the location at which the validation error occurred (e.g. query, body)
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.post("/payment", paymentObjectValidator, rejectBadRequests, checkCustomer, async (req, res) => {
    const { OrderId, payment_method, flag } = req.body;

    const tempid = shortid.generate().split("-")[0];
    const carhfreeOrderId = `${OrderId}-${tempid}`;
    const paymentMethod = Object.keys(payment_method)[0];


    if (flag !== "PENDING" && flag !== "PARTIAL_COMPLETED") {
        return res.status(500).json({ message: "Invalid flag or not allowed" });
    }

    try {
        const isOrderExist = await orderModel.findOne({ OrderId });
        const customer = await Customer.findByIdAndUpdate(req.Customer._id);

        if (isOrderExist) {
            if (isOrderExist.PendingAmount === 0 || isOrderExist.PaymentStatus === "SUCCESS") {
                return res.status(500).json({ message: `Order transaction already completed successfully` });
            }


            if (isOrderExist.PaymentStatus !== flag) {
                return res.status(500).json({ message: `Invalid flag or not match` });
            }


            let paymentObj = await Payment.createCustomerOrder({ customerid: customer._id, email: customer.email, phone: customer.phone, OrderId: carhfreeOrderId, Amount: isOrderExist.PendingAmount });

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
        } else {
            return res.status(500).json({ message: "order Id is incorrect" });
        }

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
});



/**
 * @openapi
 * /cardVerification/otp:
 *  post:
 *    summary: it's use to Verify custome card and payment confirmation
 *    tags:
 *    - Customer Payments Routes
 *    parameters:
 *      - in: path
 *        name: transsactionId
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: otp
 *        schema:
 *           type: string
 *      - in: path
 *        name: operation
 *        required: true
 *        schema:
 *           type: string
 *           enum: [RESEND_OTP, SUBMIT_OTP]
 *    responses:
 *      200:
 *          description: transsaction initialized successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: transsaction successfully
 *                  transsactionId:
 *                    type: string
 *                    description: The payment transaction id
 *                    example: 659659d9d2d92d92d92d9d2
 *      400:
 *         description: if the parameters given were invalid
 *         content:
 *           application/json:
 *             schema:
 *               required:
 *               - errors
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   description: a list of validation errors
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: object
 *                         description: the value received for the parameter
 *                       msg:
 *                         type: string
 *                         description: a message describing the validation error
 *                       param:
 *                         type: string
 *                         description: the parameter for which the validation error occurred
 *                       location:
 *                         type: string
 *                         description: the location at which the validation error occurred (e.g. query, body)
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: Error encountered.
 *    security:
 *    - bearerAuth: []
 */
router.post("/cardVerification/otp", async (req, res) => {
    const { transsactionId, otp, operation } = req.body;
    if (!transsactionId) {
        return res.status(500).json({ message: "transsactionId required" });
    }

    try {
        const fetchTransactions = await transsactioModel.findById(transsactionId);

        if (!fetchTransactions) {
            return res.status(500).json({ message: "No transaction found" });
        }

        if (fetchTransactions.payment_status !== "pending" || fetchTransactions.order_status !== "ACTIVE") {
            return res.status(500).json({ message: "transaction completed or not available" });
        }

        if (!fetchTransactions || !fetchTransactions.payment) {
            return res.status(500).json({ message: "No transaction found or incorect id" });
        }
        const resp = await Payment.authenticatePayment(operation, fetchTransactions.payment.cf_payment_id, otp);

        if (resp.data.operation === "SUBMIT_OTP" && resp.data.authenticate_status === "FAILED") {
            return res.status(200).json({ message: resp.data.payment_message, transsactionId });
        }
        else if (resp.data.operation === "SUBMIT_OTP" && resp.data.authenticate_status === "SUCCESS") {
            // transsaction successfully
            await Payment.markTranssactionSuccess(transsactionId);
            await Payment.updateOrderPaymentStatus(fetchTransactions.order_id, transsactionId);

            return res.status(200).json({ message: resp.data.payment_message, transsactionId });
        }
        else if (resp.data.operation === "RESEND_OTP") {
            return res.status(200).json({ message: resp.data.payment_message, transsactionId });
        }

        return res.status(200).json({ message: "transsaction successfully", transsactionId });
    } catch (error) {
        if (error?.response?.data?.message) {
            return res.status(500).json({ message: error.response.data.message });
        } else {
            return res.status(500).json({ message: "something went wrong" });
        }
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