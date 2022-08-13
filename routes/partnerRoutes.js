const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const { Partner, Wallet, Order } = require("../models");
const checkPartner = require("../middleware/AuthPartner");
const { orderStatusTypes } = require('../enums/types');
const tokenService = require('../services/token-service');
const validateTempToken = require('../middleware/tempTokenVerification');
const { base64_encode, generateRandomReferralCode } = require('../libs/commonFunction');
const path = require('path');
const fs = require('fs');

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

const updatePartnerValidator = [
  body("email").isEmail().withMessage("email is invalid"),
  body("dob").isEmail().withMessage("email is invalid"),

];

/**
 * @openapi
 * /partner/SendOTP:
 *  post:
 *    summary: request server to genrate and send otp on given number.
 *    tags:
 *    - partner Routes
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
router.post("/SendOTP", ...sendOtpBodyValidator, rejectBadRequests, async (req, res) => {
  //generate new otp
  let otp = generateOtp(6);
  try {
    //check if partner with given number exists and update otp in db, else create new partner.
    const isuserExist = await Partner.findOne({ phone: req?.body?.phone });

    if (isuserExist) {
      await Partner.findOneAndUpdate(
        { phone: req?.body?.phone, isActive: true },
        {
          otp: {
            code: otp,
            status: "active",
          },
        },
        { new: true }
      );
    } else {
      const newuser = new Partner({ phone: req?.body?.phone, otp: { code: otp, status: 'active' }, uniqueReferralCode: generateRandomReferralCode() });
      await newuser.save();
    }

    //send otp to user
    // sendOtp(partner.phone, otp);
    return res
      .status(200)
      .json({ message: "OTP has been sent successfully" });
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
 * /partner/VerifyOTP:
 *  post:
 *    summary: used to verify otp provided by user.
 *    tags:
 *    - partner Routes
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
router.post("/VerifyOTP", ...verifyOtpBodyValidator, rejectBadRequests, async (req, res) => {
  let resp = {};
  try {
    const partner = await Partner.findOneAndUpdate(
      {
        phone: req?.body?.phone,
        "otp.code": req?.body?.otp,
        "otp.status": "active",
      },
      {
        "otp.status": "inactive",
      },
      { new: true }
    );
    // console.log(partner);
    if (partner === null) {
      return res.status(401).json({ message: "Invalid OTP" });
    }
    // wallet creation
    const isWalletExixts = await Wallet.findOne({ partnerId: partner?._id })
    if (!isWalletExixts) {
      const newWallet = new Wallet({ partnerId: partner?._id });
      await newWallet.save();
    }

    if (!partner.isVerified) {
      resp['message'] = "Account is not verified"
    }
    else if (!partner.isApproved) {
      resp['message'] = "Account is not appproved contact admin manager"
    }
    else if (!partner.isPublished) {
      resp['message'] = "Account block contact admin manager"
    }

    if (!partner.isProfileCompleted) {
      const docToken = tokenService.generatetempToken({ _id: partner._id, tokenType: "upload_docs_token" });
      return res.status(200).json({ uid: partner._id, message: "Upload your documents", completeProfileToken: docToken, isProfileCompleted: partner.isProfileCompleted });
    }

    if (resp.message) {
      return res.status(500).json({ ...resp });
    } else {
      const { accessToken, refreshToken } = tokenService.generateAuthTokens({ _id: partner._id, type: partner.Type, isPublished: partner.isPublished }, process.env.JWT_SECRET_ACCESS_TOKEN);

      return res.status(200).json({
        message: "Login successfully",
        uid: partner._id,
        accessToken: accessToken,
        refreshToken: refreshToken,
        isApproved: partner.isApproved,
        type: partner.Type
      });
    }

  } catch (error) {
    console.log(error)
    return res
      .status(500)
      .json({ message: "Error encountered while trying to verify otp" });
  }
}
);


/**
 * @openapi
 * /partner/completeProfile:
 *  post:
 *    summary: used to upload document for fresh users
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: Name
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: address
 *        required: true
 *        schema:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             pin:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             cood:
 *               type: object
 *               properties:
 *                 lattitude:
 *                   type: string
 *                 longitude:
 *                   type: string
 *      - in: path
 *        name: Dob
 *        required: true
 *        schema:
 *           type: date
 *      - in: path
 *        name: Type
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["store", "individual"]
 *      - in: path
 *        name: Product_Service
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: email
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: gender
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: panNumber
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: aadharNumber
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: aadharImage
 *        required: true
 *        schema:
 *           type: file
 *      - in: path
 *        name: pancardImage
 *        required: true
 *        schema:
 *           type: file
 *
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
 */
router.post("/completeProfile", validateTempToken, async (req, res) => {
  let { Name, address, Dob, Type, Product_Service, email, gender, panNumber, aadharNumber } = req.body;

  let images = [];

  const _id = req.tempdata._id;
  let token_type = req.tempdata.tokenType;

  if (token_type !== 'upload_docs_token') {
    return res.status(500).json({ message: "Invalid token type" });
  }

  try {
    images.push(req.files.aadharImage);
    images.push(req.files.pancardImage);

    let fileUrls = await Promise.all(images.map((file, i) => {
      let filepath = path.join(__dirname, `../public/csv/${file.name}`);
      return new Promise((resolve, reject) => {
        file.mv(filepath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(filepath);
          }
        })
      })
    }));

    let fileString = fileUrls.map(element => {
      let st = base64_encode(element);
      fs.unlinkSync(element);
      return st;
    });

    const resp = await Partner.findByIdAndUpdate(_id, { $set: { Name, Dob, Type, Product_Service, email, gender, address, isProfileCompleted: true, aadhar: { number: aadharNumber, file: fileString[0] }, pan: { number: panNumber, file: fileString[1] } } }, { new: true });

    if (resp) {
      return res.status(201).json({ message: "profile updated successfully", data: resp });
    } else {
      return res.status(500).json({ message: "No registration found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered while trying to uploading documents" });
  }
})

router.use(checkPartner);

/**
 * @openapi
 * /partner:
 *  get:
 *    summary: gets user details.
 *    tags:
 *    - partner Routes
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
  console.log(req?.partner);
  return res.status(200).json(req?.partner);
});

/**
 * @openapi
 * /partner/changeprofile:
 *  put:
 *    summary: used to update partner profile
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: Name
 *        required: false
 *        schema:
 *           type: string
 *      - in: path
 *        name: address
 *        required: false
 *        schema:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             pin:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             cood:
 *               type: object
 *               properties:
 *                 lattitude:
 *                   type: string
 *                 longitude:
 *                   type: string
 *      - in: path
 *        name: Dob
 *        required: false
 *        placeholder: yyyy/mm/dd
 *        schema:
 *           type: date
 *      - in: path
 *        name: email
 *        required: false
 *        schema:
 *           type: string
 *      - in: path
 *        name: profilePic
 *        required: false
 *        schema:
 *           type: file
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
 */
router.put("/changeprofile", async (req, res) => {
  // const { Name, Dob, email, address } = req.body;
  let base64String = null;

  if (req.body.phone) {
    return res.status(500).json({ message: "phone number is not allowed" });
  }

  try {
    if (req.files && req.files.profilePic) {
      let profilePic = req.files.profilePic;

      let filepath = path.join(__dirname, `../public/csv/${profilePic.name}`);
      profilePic.mv(filepath, (err) => {
        if (err) {
          reject(err);
        }
      })

      base64String = base64_encode(filepath);
      fs.unlinkSync(filepath);
    }

    let update = {
      ...req.body
    }

    if (base64String) {
      update['profilePic'] = base64String;
    }

    await Partner.findByIdAndUpdate(req.partner._id, update, { new: true });
    return res.status(200).json({ message: "user updated successfully." });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while trying to update user." });
  }
}
);


/**
 * @openapi
 * /partner/myorders/{status}:
 *  get:
 *    summary: using this route user can get all orders of his/her.
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Accepted", "InRepair", "completed","all"]
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
  const partnerId = req.partner._id;
  console.log(partnerId);
  const allowedStatus = ["Accepted", "InRepair", "completed", "Cancelled"];

  if (status !== "all" && !allowedStatus.includes(status)) {
    return res.status(500).json({ message: `${status} status not allowed.` });
  }

  // if (status !== 'all' && !orderStatusTypes.includes(status)) {
  //   return res.status(400).json({ message: "Invalid status" });
  // }

  let query = { Partner: partnerId };

  if (status !== 'all') {
    query['Status'] = status;
  }

  try {
    const orders = await Order.find(query);
    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /partner/requestedorder/{city}:
 *  get:
 *    summary: using this route partner see requested orders lists
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: city
 *        required: true
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

router.get("/requestedorder/:city/:pincode?", async (req, res) => {
  let { city, pincode } = req.params;
  const queryobj = { Status: "Requested", "address.city": city };

  if (pincode) {
    queryobj['address.pin'] = pincode;
  }

  try {
    const orders = await Order.find(queryobj);

    return res.status(200).json(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /partner/order/acceptorder:
 *  post:
 *    summary: using this route partner can accept order
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: orderId
 *        required: true
 *        schema:
 *           type: string
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
router.post("/order/acceptorder", async (req, res) => {
  let { orderId } = req.body;
  const partnerId = req.partner._id;

  if (!orderId) {
    return res.status(500).json({ message: "orderId must be provided" });
  }

  try {
    const order = await Order.findOne({ OrderId: orderId });

    if (!order) {
      return res.status(500).json({ message: "order not exists" });
    }

    if (order.Status !== 'Requested') {
      return res.status(500).json({ message: "order already Accepted or further processing" });
    }

    await Order.findOneAndUpdate({ OrderId: orderId }, { Status: orderStatusTypes[2], Partner: partnerId }, { new: true });
    return res.status(200).json({ message: "order Accepted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /partner/order/changestatus:
 *  post:
 *    summary: using this route partner change the order status
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: status
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Requested", "Accepted", "InRepair", "completed","all"]
 *      - in: path
 *        name: orderId
 *        required: true
 *        schema:
 *           type: string
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
router.post("/order/changestatus", async (req, res) => {
  let { status, orderId } = req.body;
  const partnerId = req.partner._id;


  if (!status || !orderId) {
    return res.status(500).json({ message: "orderId and status must be provided" });
  }

  const allowedStatus = ["InRepair", "completed", "Cancelled"];


  if (!allowedStatus.includes(status)) {
    return res.status(500).json({ message: "status is not allowed" });
  }

  try {
    const order = await Order.findOne({ Partner: partnerId, OrderId: orderId });

    if (!order) {
      return res.status(500).json({ message: "order not belongs to this partner" });
    }

    if (order.Status === status) {
      return res.status(200).json({ message: "This is your current status" });
    }

    await Order.findOneAndUpdate({ OrderId: orderId }, { Status: status }, { new: true });
    return res.status(200).json({ message: "order status changes" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


module.exports = router;
