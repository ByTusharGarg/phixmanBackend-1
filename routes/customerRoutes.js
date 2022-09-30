const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const {
  Customer,
  Order,
  Partner,
  Counters,
  CustomerWallet,
} = require("../models");
const checkCustomer = require("../middleware/AuthCustomer");
const { isEmail, isStrong } = require("../libs/checkLib");
const tokenService = require("../services/token-service");
const { hashpassword } = require("../libs/passwordLib");
const moment = require("moment");
const fs = require("fs");

const {
  orderStatusTypes,
  orderTypes,
  paymentModeTypes,
  paymentStatus,
} = require("../enums/types");
const commonFunction = require("../utils/commonFunction");
const { generateRandomReferralCode } = require("../libs/commonFunction");
const pdf = require("pdf-creator-node");
const path = require("path");
const Payment = require("../libs/payments/Payment");

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
    .withMessage("OrderType does contain invalid value"),
  body("PaymentMode")
    .notEmpty()
    .withMessage("PaymentMode number cannot be empty")
    .isIn(paymentModeTypes)
    .withMessage("PaymentMode does contain invalid value"),
  body("PickUpRequired")
    .isBoolean()
    .withMessage("PickUpRequired Must be a boolean true or false"),
  body("Items").isArray().withMessage("Items should be an array"),
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
      const isuserExist = await Customer.findOne({ phone: req?.body?.phone });
      if (isuserExist) {
        await Customer.findOneAndUpdate(
          { phone: req?.body?.phone },
          { otp: { code: otp, status: "active" } },
          { new: true }
        );
        //send otp to user
        // sendOtp(isuserExist.phone, otp);
      } else {
        const newuser = new Customer({
          phone: req?.body?.phone,
          otp: { code: otp, status: "active" },
          uniqueReferralCode: generateRandomReferralCode(),
        });
        await newuser.save();
        //send otp to user
      }
      sendOtp(req?.body?.phone, otp);
      return res
        .status(200)
        .json({ message: "OTP has been sent successfully", otp: otp });
    } catch (error) {
      console.log(error);
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
    let resp = {};
    try {
      const customer = await Customer.findOneAndUpdate(
        {
          phone: req?.body?.phone,
          "otp.code": req?.body?.otp,
          "otp.status": "active",
        },
        { "otp.status": "inactive" },
        { new: true }
      );

      if (customer === null) {
        return res.status(401).json({ message: "Invalid OTP" });
      }

      if (!customer.isVerified) {
        // This condition runs when customer login first time
        const up = await Customer.findOneAndUpdate(
          { phone: req?.body?.phone },
          {
            "otp.code": req?.body?.otp,
            "otp.status": "active",
            isVerified: true,
          },
          { new: true }
        );

        // generate customer wallet
        const isWalletExists = await CustomerWallet.findOne({
          customerId: customer?._id,
        });
        if (!isWalletExists) {
          const newWallet = new CustomerWallet({ customerId: customer?._id });
          await newWallet.save();
        }
      }

      if (!customer.isPublished) {
        resp["message"] =
          "Account block contact admin . please wait for approval.";
      }

      if (resp.message) {
        return res.status(500).json({ ...resp });
      } else {
        const { accessToken, refreshToken } = tokenService.generateAuthTokens(
          { _id: customer._id, isPublished: customer.isPublished },
          process.env.JWT_SECRET_ACCESS_TOKEN
        );
        return res.status(200).json({
          message: "Login successfully",
          uid: customer._id,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isApproved: customer.isApproved,
        });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Error encountered while trying to verify otp" });
    }
  }
);

/**
 * middleware to check if customer has access to perform following actions
 */
router.get("/generatepdf/:orderid", async (req, res, next) => {
  // const Customer = req.Customer._id;
  const { orderid } = req.params;

  const html = fs.readFileSync(
    path.join(__dirname, "../libs/mailer/template/invoice.html"),
    "utf-8"
  );
  let orderData = null;

  const filename = Math.random() + "_doc" + ".pdf";

  try {
    orderData = await Order.findById(orderid).populate('OrderDetails.Items.ServiceId')
      .populate('Customer').populate('Partner');

    console.log(orderData.OrderDetails);

    if (!orderData) {
      return res.status(404).json({ message: "order not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered while finding orders pdf." });
  }

  let array = [
    { serviceName: "kijikjsj" },
    { serviceName: "okoko" },
    { serviceName: "kijikdokdojsj" },
    { serviceName: "kijikdokdojsj" },
    { serviceName: "kijikdokdojsj" },
    { serviceName: "kijikdokdojsj" },
    { serviceName: "kijikdokdojsj" },
    { serviceName: "kijikdokdojsj" },
    { serviceName: "kijikdokdojsj" },
    { serviceName: "kijikdokdojsj" },
  ];

  let totalAmount = orderData.OrderDetails.Amount;

  let gstnineP = (totalAmount * 9) / 100;

  const obj = {
    prodlist: array,
    bAmt: 10,
    eAmt: totalAmount - gstnineP * 2,
    disCount: 0,
    tax: gstnineP * 2,
    cgst: gstnineP,
    sgst: gstnineP,
    totalAmt: totalAmount,
    customer: {
      name: orderData.Customer.Name || 'N/A',
      gst: "N/A",
      invoiceNum: orderData.invoiceId,
      address: `${orderData.address.street} ${orderData.address.city} ${orderData.address.state} ${orderData.address.country} ${orderData.address.pin}`,
      date: moment(orderData.Date, 'DD-MM-YYYY').format('MM-DD-YYYY'),
      sNc: moment(orderData.Date, 'DD-MM-YYYY').format('MM-DD-YYYY'),
      placeOfSupply: orderData.address.country || "N/A",
    },
    partner: {
      bName: orderData.Partner?.Name || "N/A",
      bGst: "N/A",
      bAddress: `${orderData.address.street} ${orderData.address.city} ${orderData.address.state} ${orderData.address.country} ${orderData.address.pin}`,
      sNc: moment(orderData.Date, 'DD-MM-YYYY').format('MM-DD-YYYY')
    },
  };

  // console.log(obj);
  const document = {
    html: html,
    data: {
      products: obj,
    },
    path: "./docs/" + filename,
  };

  let options = {
    formate: "A3",
    orientation: "portrait",
    border: "2mm",
    header: {
      height: "15mm",
      contents:
        '<h4 style=" color: red;font-size:20;font-weight:800;text-align:center;">CUSTOMER INVOICE</h4>',
    },
    footer: {
      height: "20mm",
      contents: {
        first: "Cover page",
        2: "Second page",
        default:
          'div style="float: right;">Signature of supplier/authorized representative</div>',
        last: "Last Page",
      },
    },
  };

  try {
    const data = await pdf.create(document, options)

    res.setHeader('Content-disposition', 'inline; filename="test.pdf"');
    res.setHeader('Content-type', 'application/pdf');

    var fileData = fs.readFileSync(data.filename);

    let interval = setTimeout(() => {
      fs.unlink(data.filename, () => { });
      clearInterval(interval);
    }, 3000)

    return res.send(fileData);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered while generating pdf." });
  }
});

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
 *  post:
 *    summary: successfully added new address for the user.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                address:
 *                  type: object
 *                  properties:
 *                   street:
 *                    type: string
 *                   city:
 *                    type: string
 *                   pin:
 *                    type: string
 *                   state:
 *                    type: string
 *                   type:
 *                    type: string
 *                   cood:
 *                    type: object
 *                    properties:
 *                     lattitude:
 *                      type: string
 *                     longitude:
 *                      type: string
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
    if (!req?.body?.address || Object.keys(req?.body?.address).length === 0) {
      return res.status(404).json({ message: "address field not found." });
    }
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
 *                OrderType:
 *                  type: string
 *                  enum: ["Visit Store", "Home Visit", "Pick & Drop"]
 *                timeSlot:
 *                  type: object
 *                  properties:
 *                    from:
 *                      type: string
 *                    to:
 *                      type: string
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
 *                PaymentMode:
 *                  type: string
 *                  enum: [cod,online]
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
 *    security:
 *    - bearerAuth: []
 */
router.post(
  "/create/order",
  verifyOrderValidator,
  rejectBadRequests,
  async (req, res) => {
    console.log(req.body);
    const { OrderType, Items, PaymentMode, address, PickUpRequired } = req.body;
    const OrderId = commonFunction.genrateID("ORD");
    let Amount = 0;
    let grandTotal = 0;

    Items.map((element) => (Amount += element?.Cost));
    grandTotal = Amount;

    try {
      let resp = { message: "Orders created successfully." };

      if (PaymentMode === "cod") {
        const newOrder = new Order({
          Customer: req.Customer._id,
          OrderId,
          OrderType,
          Status: orderStatusTypes[1],
          PendingAmount: Amount,
          PaymentStatus: paymentStatus[1],
          OrderDetails: { Amount, Items },
          PaymentMode,
          address,
          PickUpRequired,
        });
        resp.order = await newOrder.save();
        // deduct commission from partner
      } else if (PaymentMode === "online") {
        // initiate payments process
        const newOrder = new Order({
          Customer: req.Customer._id,
          OrderId,
          OrderType,
          Status: orderStatusTypes[0],
          PendingAmount: Amount,
          PaymentStatus: paymentStatus[1],
          OrderDetails: { Amount, Gradtotal: grandTotal, Items },
          PaymentMode,
          address,
          PickUpRequired,
        });
        const customer = await Customer.findById(req.Customer._id);
        let cashfree = await Payment.createCustomerOrder({
          customerid: customer._id,
          email: customer.email,
          phone: customer.phone,
          OrderId,
          Amount,
        });
        resp.order = await newOrder.save();
        resp.cashfree = cashfree;
      }

      // send notifications to all partners

      return res.status(200).json(resp);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error encountered." });
    }
  }
);

/**
 * @openapi
 * /customer/verifyOrderStatus:
 *   post:
 *    summary: it's use to verify order payment status.
 *    tags:
 *    - Customer Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                order_id:
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
router.post("/verifyOrderStatus", async (req, res) => {
  try {
    if (!req.body.order_id) {
      return res.status(404).json({ message: "order id is required" });
    }
    const resp = await Payment.verifyCustomerOrder(req.body.order_id);
    return res.status(200).json(resp);
  } catch (error) {
    console.log(error);
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

    await Order.findByIdAndUpdate(
      isOrdrrBelongs._id,
      { Status: "Cancelled" },
      { new: true }
    );

    return res.status(200).json({ message: "Orders Cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

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

  if (status !== "all" && !orderStatusTypes.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  let query = { Customer };

  if (status !== "all") {
    query["Status"] = status;
  }

  try {
    const orders = await Order.find(query)
      .populate("Partner")
      .populate("Customer")
      .populate("OrderDetails.Items.ServiceId")
      .populate("OrderDetails.Items.CategoryId")
      .populate("OrderDetails.Items.ModelId");
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

module.exports = router;
