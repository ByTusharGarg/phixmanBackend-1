const Payment = require('../libs/payments/Payment');
const transsactioModel = require('../models/Ordertransaction');
const orderModel = require('../models/Order');


const router = require("express").Router();

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

// router.post("/verifypayment/failed",async (req, res)=>{
//     console.log(req.body);
// });



// router.post("/verifypayment/dropped",async (req, res)=>{
//     console.log(req.body);
// });


module.exports = router;