const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const { Customer, Order, Partner, Counters } = require("../models");
const checkCustomer = require("../middleware/AuthCustomer");
const { isEmail, isStrong } = require("../libs/checkLib");
const { hashpassword } = require("../libs/passwordLib");
const { orderStatusTypes, orderTypes, paymentModeTypes, paymentStatus } = require('../enums/types');
const commonFunction = require('../utils/commonFunction');

const sendOtpBodyValidator = [
  body("phone")
    .notEmpty()
    .withMessage("phone number cannot be empty")
    .isString()
    .withMessage("phone number should be string"),
];
const verifyOtpBodyValidator = [
  body("otp")
    .notEmpty()
    .withMessage("otp number cannot be empty")
    .isString()
    .withMessage("otp number should be string"),
  body("phone")
    .notEmpty()
    .withMessage("phone number cannot be empty")
    .isString()
    .withMessage("phone number should be string"),
];

const updateUserValidator = [
  body("email").isEmail().withMessage("email is invalid"),
  body("Password").isString().withMessage("password should be a string"),
];



const verifyOrderValidator = [
  body("OrderType")
    .notEmpty()
    .withMessage("OrderType number cannot be empty")
    .isIn(orderTypes)
    .withMessage('OrderType does contain invalid value'),
  body("PaymentMode")
    .notEmpty()
    .withMessage("PaymentMode number cannot be empty")
    .isIn(paymentModeTypes)
    .withMessage('PaymentMode does contain invalid value'),
  body("PickUpRequired")
    .isBoolean()
    .withMessage('PickUpRequired Must be a boolean true or false'),
  body("Items")
    .isArray()
    .withMessage('Items should be an array')
];

/**
 * @openapi
 * /customer/SendOTP:
 *  post:
 *    summary: request server to genrate and send otp on given number.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
 *                  type: string
 *    responses:
 *      200:
 *          description: if otp is sent successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
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
 */
router.post(
  "/SendOTP",
  ...sendOtpBodyValidator,
  rejectBadRequests,
  async (req, res) => {
    //generate new otp
    let otp = generateOtp(6);
    try {
      //check if customer with given number exists and update otp in db, else create new customer.
      const customer = await Customer.findOneAndUpdate(
        { phone: req?.body?.phone },
        {
          otp: {
            code: otp,
            status: "active",
          },
        },
        { upsert: true, new: true }
      );
      //send otp to user
      sendOtp(customer.phone, otp);
      return res
        .status(200)
        .json({ message: "OTP has been sent successfully" });
    } catch (error) {
      console.log(error)
      return res
        .status(500)
        .json({ message: "Error encountered while trying to send otp" });
    }
  }
);

/**
 * @openapi
 * /customer/VerifyOTP:
 *  post:
 *    summary: used to verify otp provided by user.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                phone:
 *                  type: string
 *                otp:
 *                  type: string
 *    responses:
 *      200:
 *          description: if user exists and otp is sent successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP verified successfully.
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
 */
router.post(
  "/VerifyOTP",
  ...verifyOtpBodyValidator,
  rejectBadRequests,
  async (req, res) => {
    try {
      const customer = await Customer.findOneAndUpdate(
        {
          phone: req?.body?.phone,
          "otp.code": req?.body?.otp,
          "otp.status": "active",
        },
        {
          "otp.status": "inactive",
          isVerified: true,
        },
        { new: true }
      );
      if (customer === null) {
        return res.status(401).json({ message: "Invalid OTP" });
      }
      return res
        .status(200)
        .json({ message: "OTP verified successfully", uid: customer._id });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error encountered while trying to verify otp" });
    }
  }
);

/**
 * middleware to check if customer has access to perform following actions
 */
router.use(checkCustomer);

/**
 * @openapi
 * /customer:
 *  patch:
 *    summary: used to update user data.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *              type: object
 *              properties:
 *                email:
 *                  type: string
 *                Password:
 *                  type: string
 *                image:
 *                  type: file
 *                gender:
 *                  type: string
 *                  enum: ["male", "female", "non-binary"]
 *          encoding:
 *              image:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *    responses:
 *      200:
 *          description: if user updated successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: user updated successfully.
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
 *      404:
 *          description: if user not found or auth token not supplied.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
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
router.patch(
  "/",
  ...updateUserValidator,
  rejectBadRequests,
  async (req, res) => {
    try {
      let update = req?.body;
      if (req?.body?.email && req?.body?.email === "") {
        update.email = req?.body?.email.toLowerCase();
      }
      if (req?.body?.Password && req?.body?.Password === "") {
        if (!isStrong(req?.body?.Password)) {
          return res
            .status(400)
            .json({ message: "password is not strong enough." });
        }
        update.Password = hashpassword(req?.body?.Password);
      }
      if (req?.files?.image) {
        console.log(req.files.image);
        update.image = "";
      }
      const customer = await Customer.findByIdAndUpdate(
        req.Customer._id,
        update,
        { new: true }
      );
      return res.status(200).json({ message: "user updated successfully." });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error encountered while trying to update user." });
    }
  }
);

/**
 * @openapi
 * /customer:
 *  get:
 *    summary: gets user details.
 *    tags:
 *    - Customer Routes
 *    responses:
 *      200:
 *          description: if successfully found user
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               description: customer details
 *      404:
 *          description: if user not found or auth token not supplied.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
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
router.get("/", async (req, res) => {
  console.log(req?.Customer);
  return res.status(200).json(req?.Customer);
});

/**
 * @openapi
 * /customer/address:
 *  get:
 *    summary: gets all the saved addresses for the user.
 *    tags:
 *    - Customer Routes
 *    responses:
 *      200:
 *          description: if successfully found user
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               description: customer details
 *      404:
 *          description: if user not found or auth token not supplied.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
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
router.get("/address", async (req, res) => {
  return res.status(200).json(req?.Customer?.address);
});

/**
 * @openapi
 * /customer/address:
 *  post:
 *    summary: successfully added new address for the user.
 *    tags:
 *    - Customer Routes
 *    responses:
 *      200:
 *          description: if successfully found user
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               description: customer details
 *      404:
 *          description: if user not found or auth token not supplied.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
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
router.post("/address", async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(
      req.Customer._id,
      {
        $push: { address: req?.body?.address },
      },
      { new: true }
    );
    return res.status(200).json({ message: "address added" });
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /customer/create/order:
 *  post:
 *    summary: it's use to create a requested new order to partner.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                PartnerId:
 *                  type: string
 *                OrderType:
 *                  type: string
 *                  enum: [InStore, Home]
 *                Items:
 *                  type: array
 *                  items:
 *                    properties:
 *                      CategoryId:
 *                        type: string
 *                      ModelId:
 *                        type: string
 *                      ServiceId:
 *                        type: string
 *                      Cost:
 *                        type: integer
 *
 *                PaymentMode:
 *                  type: string
 *                  enum: [cod]
 *                address:
 *                  type: object
 *                  properties:
 *                    street:
 *                      type: string
 *                    city:
 *                      type: string
 *                    pin:
 *                      type: string
 *                    state:
 *                      type: string
 *                    country:
 *                      type: string
 *                    cod:
 *                      type: object
 *                      properties:
 *                         lattitude:
 *                           type: string
 *                         longitude:
 *                            type: string
 *                PickUpRequired:
 *                  type: srting
 *    responses:
 *      200:
 *          description: if otp is sent successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
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
router.post("/create/order", verifyOrderValidator, rejectBadRequests, async (req, res) => {
  const Customer = req.Customer._id;
  const { OrderType, Items, PaymentMode, address, PickUpRequired } = req.body;
  const Status = orderStatusTypes[0];
  const OrderId = commonFunction.genrateID("ORD");

  let Amount = 0;

  Items.map(element => Amount += element?.Cost)

  try {
    // const isPartnerExist = Partner.findById(PartnerId);
    // if (!isPartnerExist) {
    //   let counterValue = await Counters.findOneAndUpdate(
    //     { name: "orders" },
    //     { $inc: { seq: 1 } },
    //     { new: true }
    //   );

      let resp = {};

      if (PaymentMode === "cod") {
        const newOrder = new Order({ Customer, OrderId, OrderType, Status, PendingAmount: Amount, PaymentStatus: paymentStatus[0], OrderDetails: { Amount, Items }, PaymentMode, address, PickUpRequired });
        resp = await newOrder.save();
        // deduct commission from partner


      } else if (PaymentMode === "online") {
        // initiate payments process
        const newOrder = new Order({ Customer, OrderId, OrderType, Status, PendingAmount: Amount, PaymentStatus: paymentStatus[1], OrderDetails: { Amount, Items }, PaymentMode, address, PickUpRequired });
        // let paymentObj = await Payment.createCustomerOrder({customerid:"irfhuhfuih6560",email:"tarun@iotric.com",phone:"8510967005",OrderId:carhfreeOrderId,Amount:Amount});
        resp = await newOrder.save();
        // genrate order


        // initiate transaction
      }

      return res.status(200).json({ message: "Orders created successfully.", newOrder: resp });
    // } else {
    //   return res.status(500).json({ message: "Partner not found" });
    // }


  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /customer/cancel:
 *   post:
 *    summary: it's use to cancel the order.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                id:
 *                  type: string
 *    responses:
 *      200:
 *          description: if order cancelled successfully
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  message:
 *                    type: string
 *                    description: a human-readable message describing the response
 *                    example: OTP has been sent successfully.
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
 *     - bearerAuth: []
 */
router.post("/cancel", async (req, res) => {
  const { id } = req.body;
  const Customer = req.Customer._id;
  const orderStatusTypes = ["Requested", "Accepted"];

  try {
    const isOrdrrBelongs = await Order.find({ _id: id, Customer });

    if (!isOrdrrBelongs) {
      return res.status(500).json({ message: "This order not belongs to you" });
    }

    if (!orderStatusTypes.includes(isOrdrrBelongs.Status)) {
      return res.status(500).json({ message: "This order can't be Cancelled" });
    }

    await Order.findByIdAndUpdate(isOrdrrBelongs._id, { Status: "Cancelled" }, { new: true });

    return res.status(200).json({ message: "Orders Cancelled successfully" });

  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
})


/**
 * @openapi
 * /customer/myorders/{status}:
 *  get:
 *    summary: using this route user can get all orders of his/her.
 *    tags:
 *    - Customer Routes
 *    parameters:
 *      - in: path
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Requested", "Accepted", "InRepair", "completed","all"]
 *    responses:
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

router.get("/myorders/:status", async (req, res) => {
  let { status } = req.params;
  const Customer = req.Customer._id;

  if (status !== 'all' && !orderStatusTypes.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  let query = { Customer };

  if (status !== 'all') {
    query = { Status: status }
  }

  try {
    const orders = await Order.find(query);
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});



module.exports = router;
