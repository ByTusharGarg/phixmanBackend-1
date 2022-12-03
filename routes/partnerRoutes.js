const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const { Partner, PartnerWallet, Order, orderMetaData, category } = require("../models");
const checkPartner = require("../middleware/AuthPartner");
const { orderStatusTypesObj } = require("../enums/types");
const tokenService = require("../services/token-service");
const validateTempToken = require("../middleware/tempTokenVerification");
const { v4: uuidv4 } = require('uuid');
const payout = require('../libs/payments/payouts.js');
const { makePartnerTranssaction } = require('../services/Wallet');

const {
  base64_encode,
  generateRandomReferralCode,
} = require("../libs/commonFunction");
const path = require("path");
const fs = require("fs");
const {
  uploadFile,
  randomImageName,
  getObjectSignedUrl,
} = require("../services/s3-service");
const commonFunction = require("../utils/commonFunction");
const Payment = require("../libs/payments/Payment");
const {
  getWallletTransactionByTransactionId,
  getAllWallletTranssactionForUser,
} = require("../services/Wallet");
const emailDatamapping = require("../common/emailcontent");

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
  body("dob").isString().withMessage("dob is invalid"),
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
router.post(
  "/SendOTP",
  // ...sendOtpBodyValidator,
  // rejectBadRequests,
  async (req, res) => {
    //generate new otp
    let otp = generateOtp(6);
    console.log(otp);
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
        // sendOtp(isuserExist.phone, otp);
      } else {
        const newuser = new Partner({
          phone: req?.body?.phone,
          otp: { code: otp, status: "active" },
          uniqueReferralCode: generateRandomReferralCode(),
        });
        await newuser.save();
      }
      sendOtp(req?.body?.phone, otp);
      return res
        .status(200)
        .json({ message: "OTP has been sent successfully", otp });
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
router.post(
  "/VerifyOTP",
  ...verifyOtpBodyValidator,
  rejectBadRequests,
  async (req, res) => {
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
      const isWalletExixts = await PartnerWallet.findOne({
        partnerId: partner?._id,
      });
      if (!isWalletExixts) {
        const newWallet = new PartnerWallet({ partnerId: partner?._id });
        await newWallet.save();
      }

      if (!partner.isVerified) {
        resp["message"] = "Account is not verified";
      } else if (!partner.isApproved) {
        resp["message"] = "Account is not appproved contact admin manager";
      } else if (!partner.isPublished) {
        resp["message"] = "Account block contact admin manager";
      }

      if (!partner.isProfileCompleted && partner.Type !== "sub-provider") {
        const docToken = tokenService.generatetempToken({
          _id: partner._id,
          tokenType: "upload_docs_token",
        });
        return res.status(200).json({
          uid: partner._id,
          message: "Upload your documents",
          completeProfileToken: docToken,
          isProfileCompleted: partner.isProfileCompleted,
        });
      }

      if (resp.message) {
        return res.status(200).json({ ...resp });
      } else {
        const { accessToken, refreshToken } = tokenService.generateAuthTokens(
          {
            _id: partner._id,
            type: partner.Type,
            isPublished: partner.isPublished,
          },
          process.env.JWT_SECRET_ACCESS_TOKEN
        );

        return res.status(200).json({
          message: "Login successfully",
          uid: partner._id,
          accessToken: accessToken,
          refreshToken: refreshToken,
          isApproved: partner.isApproved,
          type: partner.Type,
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
 * @openapi
 * /partner/completeProfile:
 *  post:
 *    summary: used to upload document for fresh users
 *    tags:
 *    - partner Routes
 *    requestBody:
 *     content:
 *       multipart/form-data:
 *        schema:
 *          type: object
 *          properties:
 *            Name:
 *              type: string
 *              required: true
 *            bussinessName:
 *              type: string
 *              required: true
 *            gender:
 *              type: string
 *              required: true
 *            email:
 *              type: string
 *              required: true
 *            Dob:
 *              type: string
 *              required: true
 *            Type:
 *              type: string
 *              required: true
 *              enum: ["store", "individual"]
 *            Product_Service:
 *              type: string
 *              required: true
 *            panNumber:
 *              type: string
 *              required: true
 *            experienceYears:
 *              type: number
 *              required: true
 *            workingdays:
 *              type: array
 *              required: true
 *            aadharNumber:
 *              type: string
 *              required: true
 *            business_hours:
 *              type: object
 *              required: true
 *              properties:
 *               start_hour:
 *                type: string
 *               end_hour:
 *                type: string
 *            address:
 *              type: object
 *              required: true
 *              properties:
 *               street:
 *                type: string
 *               city:
 *                type: string
 *               pin:
 *                type: string
 *               state:
 *                type: string
 *               country:
 *                type: string
 *               landmark:
 *                type: string
 *               billingAddress:
 *                type: string
 *               address:
 *                type: string
 *               cood:
 *                type: object
 *                properties:
 *                 lattitude:
 *                   type: string
 *                 longitude:
 *                   type: string
 *            secondaryNumber:
 *              type: string
 *            aadharImageF:
 *              type: file
 *              required: true
 *            aadharImageB:
 *              type: file
 *              required: true
 *            pancardImage:
 *              type: file
 *              required: true
 *            gstCertificate:
 *              type: file
 *              required: false
 *              description: required for businesses
 *            gstCertificateNo:
 *              type: string
 *              required: false
 *              description: required for businesses
 *            incorprationCertificate:
 *              type: file
 *              required: false
 *              description: required for businesses
 *            expCertificate:
 *              type: file
 *              required: false
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
router.post("/completeProfile", validateTempToken, async (req, res) => {
  if (!req.body || !req.files) {
    return res.status(404).json({
      message: "aadharImageF, aadharImageB documents required",
    });
  }
  let {
    Name,
    bussinessName,
    business_hours,
    address,
    Dob,
    Type,
    Product_Service,
    email,
    gender,
    workingdays,
    experienceYears,
    panNumber,
    aadharNumber,
    secondaryNumber,
    gstCertificateNo,
  } = req.body;

  // console.log(Product_Service);

  let images = [];
  let docs = {};

  const {
    aadharImageF,
    aadharImageB,
    pancardImage,
    gstCertificate,
    incorprationCertificate,
    expCertificate,
  } = req.files;

  if (!aadharImageF || !aadharImageB) {
    return res.status(404).json({
      message: "aadharImageF, aadharImageB documents required",
    });
  } else {
    images.push({ ...aadharImageF, fileName: randomImageName() });
    images.push({ ...aadharImageB, fileName: randomImageName() });
  }

  if (pancardImage) {
    images.push({ ...pancardImage, fileName: randomImageName() });
    docs["pan"] = { number: panNumber, file: images[2]?.fileName };
  } else {
    images.push(undefined);
    docs["pan"] = null;
  }

  docs["incorprationCertificate"] = incorprationCertificate
    ? randomImageName()
    : null;
  docs["gstCertificate"] = gstCertificate ? randomImageName() : null;

  if (incorprationCertificate) {
    images.push({ ...incorprationCertificate, fileName: randomImageName() });
  } else {
    images.push(undefined);
  }
  if (gstCertificate) {
    images.push({ ...gstCertificate, fileName: randomImageName() });
  } else {
    images.push(undefined);
  }

  docs["expCertificate"] = expCertificate ? randomImageName() : null;
  if (expCertificate) {
    images.push({ ...expCertificate, fileName: randomImageName() });
  } else {
    images.push(undefined);
  }

  const _id = req.tempdata._id;
  let token_type = req.tempdata.tokenType;

  if (token_type !== "upload_docs_token") {
    return res.status(500).json({ message: "Invalid token type" });
  }

  try {
    await Promise.all(
      images.map((file, i) => {
        if (file) {
          return uploadFile(file.data, file.fileName, file.mimetype);
        } else {
          return;
        }
      })
    );
    // console.log(JSON.parse(address));
    const resp = await Partner.findByIdAndUpdate(
      _id,
      {
        $set: {
          Name,
          bussinessName,
          Dob,
          Type,
          Product_Service: JSON.parse(Product_Service),
          email,
          experienceYears,
          gender,
          address: JSON.parse(address),
          isProfileCompleted: true,
          aadhar: {
            number: aadharNumber,
            fileF: images[0].fileName,
            fileB: images[1].fileName,
          },
          secondaryNumber,
          business_hours,
          workingdays,
          gstCertificateNo,
          ...docs,
        },
      },
      { new: true }
    );

    if (resp) {
      return res
        .status(201)
        .json({ message: "profile updated successfully", data: resp });
    } else {
      return res.status(500).json({ message: "No registration found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered while trying to uploading documents",
    });
  }
});

router.use(checkPartner);

/**
 * @openapi
 * /partner/myprofile:
 *  get:
 *    summary: gets partners details.
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
router.get("/myprofile", async (req, res) => {
  const partnerId = req.partner._id;
  try {
    const profile = await Partner.findById(partnerId).populate(
      "Product_Service"
    );

    profile["aadhar"]["fileF"] = await getObjectSignedUrl(
      profile?.aadhar?.fileF
    );

    profile["aadhar"]["fileB"] = await getObjectSignedUrl(
      profile?.aadhar?.fileB
    );

    if (profile["pan"]["file"]) {
      profile["pan"]["file"] = await getObjectSignedUrl(profile.pan.file);
    }
    if (profile["gstCertificate"]) {
      profile["gstCertificate"] = await getObjectSignedUrl(
        profile.gstCertificate
      );
    }
    if (profile["incorprationCertificate"]) {
      profile["incorprationCertificate"] = await getObjectSignedUrl(
        profile.incorprationCertificate
      );
    }
    if (profile["expCertificate"]) {
      profile["expCertificate"] = await getObjectSignedUrl(
        profile.expCertificate
      );
    }

    if (profile["profilePic"]) {
      profile["profilePic"] = await getObjectSignedUrl(profile.profilePic);
    }

    return res.status(200).json({ message: "user profile.", data: profile });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while trying to fetching profile." });
  }
});

/**
 * @openapi
 * /partner/changeprofile:
 *  patch:
 *    summary: used to update partner profile
 *    tags:
 *    - partner Routes
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
 *                Name:
 *                  type: string
 *                Product_Service:
 *                  type: array
 *                Dob:
 *                  type: string
 *                bussinessName:
 *                  type: string
 *                workingdays:
 *                  type: array
 *                business_hours:
 *                  type: object
 *                  properties:
 *                    start_hour:
 *                      type: string
 *                    end_hour:
 *                      type: string
 *                address:
 *                  type: object
 *                  properties:
 *                    city:
 *                      type: string
 *                    state:
 *                      type: string
 *                    country:
 *                      type: string
 *                    street:
 *                      type: string
 *                    pin:
 *                      type: string
 *                    landmark:
 *                       type: string
 *                    billingAddress:
 *                       type: string
 *                    address:
 *                       type: string
 *                    cood:
 *                      type: object
 *                      properties:
 *                        lattitude:
 *                          type: string
 *                        longitude:
 *                          type: string
 *                panNumber:
 *                  type: string
 *                pancardImage:
 *                  type: file
 *                aadharNumber:
 *                  type: string
 *                secondaryNumber:
 *                  type: string
 *                aadharImageF:
 *                  type: file
 *                aadharImageB:
 *                  type: file
 *                gstCertificate:
 *                  type: file
 *                gstCertificateNo:
 *                  type: string
 *                incorprationCertificate:
 *                  type: file
 *                expCertificate:
 *                  type: file
 *                gender:
 *                  type: string
 *                  enum: ["male", "female", "non-binary"]
 *                Type:
 *                  type: string
 *                  enum: ["store", "individual"]
 *          encoding:
 *              image:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *              pan:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *              aadhar:
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.patch("/changeprofile", rejectBadRequests, async (req, res) => {
  let update = req?.body;
  let images = [];
  let docs = {};

  if (req.body.Product_Service) {
    req.body.Product_Service = JSON.stringify(req.body.Product_Service);
  }
  if (req?.body?.phone) {
    return res.status(400).json({ message: "phone number not allowed" });
  }

  if (req?.body?.Password && req?.body?.Password === "") {
    if (!isStrong(req?.body?.Password)) {
      return res
        .status(400)
        .json({ message: "password is not strong enough." });
    }
    update.Password = hashpassword(req?.body?.Password);
  }

  if (
    req?.files?.aadharImageF &&
    req?.files?.aadharImageB &&
    req.body.aadharNumber
  ) {
    let af = randomImageName();
    let ab = randomImageName();

    images.push({ ...req?.files?.aadharImageF, fileName: af });
    images.push({ ...req?.files?.aadharImageB, fileName: ab });
    docs["aadhar"] = { number: req.body.aadharNumber, fileF: af, fileB: ab };
  }

  if (req?.files?.pancardImage && req.body.panNumber) {
    let panName = randomImageName();
    images.push({ ...req?.files?.pancardImage, fileName: panName });
    docs["pan"] = { number: req.body.panNumber, file: panName };
  }

  if (req?.files?.gstCertificate) {
    let name = randomImageName();
    images.push({ ...req?.files?.gstCertificate, fileName: name });
    docs["gstCertificate"] = name;
  }

  if (req?.files?.incorprationCertificate) {
    let name = randomImageName();
    images.push({ ...req?.files?.incorprationCertificate, fileName: name });
    docs["incorprationCertificate"] = name;
  }

  if (req?.files?.expCertificate) {
    let name = randomImageName();
    images.push({ ...req?.files?.expCertificate, fileName: name });
    docs["expCertificate"] = name;
  }
  try {
    await Promise.all(
      images.map((file) => {
        if (file) {
          return uploadFile(file.data, file.fileName, file.mimetype);
        } else {
          return;
        }
      })
    );

    await Partner.findByIdAndUpdate(
      req.partner._id,
      { ...update, ...docs },
      { new: true }
    );
    return res.status(200).json({ message: "partner updated successfully." });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while trying to update user." });
  }
});

/**
 * @openapi
 * /partner/orderdetails/{OrderId}:
 *  get:
 *    summary: used to fetch a specific order by OrderId.
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: OrderId
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

router.get("/orderdetails/:id", async (req, res) => {
  const OrderId = req.params.id;
  const partnerId = req.partner._id;

  try {
    const order = await Order.findOne({ Partner: partnerId, OrderId })
      .populate("Customer", "Name email")
      .populate("OrderDetails.Items.ServiceId")
      .populate("OrderDetails.Items.CategoryId")
      .populate("OrderDetails.Items.CategoryId.forms.features")
      .populate("OrderDetails.Items.ModelId");

    if (order) {
      return res.status(200).json({ message: "order details", data: order });
    } else {
      return res.status(404).json({ message: "No order found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /partner/changeprofilepic:
 *  patch:
 *    summary: used to update partner profile pic
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        multipart/form-data:
 *          schema:
 *              type: object
 *              properties:
 *                profilePic:
 *                  type: file
 *          encoding:
 *              image:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *              pan:
 *                  contentType: image/png, image/jpeg, image/jpg, image/gif
 *              aadhar:
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
 *
 *    security:
 *    - bearerAuth: []
 */
router.patch("/changeprofilepic", rejectBadRequests, async (req, res) => {
  let fileName = randomImageName();

  if (!req?.files?.profilePic) {
    return res.status(400).json({ message: "profile pic required" });
  }

  try {
    await uploadFile(
      req?.files.profilePic?.data,
      fileName,
      req?.files.profilePic?.mimetype
    );
    await Partner.findByIdAndUpdate(req.partner._id, { profilePic: fileName });
    return res.status(200).json({ message: "profile updated successfully." });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while trying to update user." });
  }
});

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

  let query = { Partner: partnerId };

  if (status !== "all") {
    query["Status"] = status;
  } else {
    query["Status"] = { $ne: "Requested" };
  }

  try {
    const orders = await Order.find(query)
      .populate("Partner", "Name bussinessName")
      .populate("OrderDetails.Items.ServiceId")
      .populate("Customer");

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
    queryobj["address.pin"] = pincode;
  }

  try {
    const orders = await Order.find(queryobj)
      .populate("OrderDetails.Items.ServiceId")
      .populate("Customer");
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
 *      - in: query
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
  let { orderId } = req.query;
  const partnerId = req.partner._id;

  if (!orderId) {
    return res.status(500).json({ message: "orderId must be provided" });
  }

  try {
    const order = await Order.findOne({ OrderId: orderId });

    if (!order) {
      return res.status(500).json({ message: "order not exists" });
    }

    const categoryData = await category.findById(order.OrderDetails.Items[0]['CategoryId']);
    if (!categoryData) {
      return res.status(404).json({ message: "no category data found" });
    }
    const LeadExpense = parseInt(categoryData['LeadExpense']);

    if (!LeadExpense) {
      return res.status(400).json({ message: "unable to accept LeadExpense not found" });
    }

    await makePartnerTranssaction("partner", "", partnerId, LeadExpense, `Lead expenses against ${order.OrderId}`, "debit");

    if (order.Status !== "Requested") {
      return res
        .status(200)
        .json({ message: "order already Accepted or further processing" });
    }

    await Order.findOneAndUpdate(
      { OrderId: orderId },
      {
        Status: orderStatusTypesObj["Accepted"],
        Partner: partnerId,
        $push: {
          statusLogs: {
            status: orderStatusTypesObj.Accepted,
            timestampLog: new Date(),
          },
        },
      },
      { new: true }
    );
    return res.status(200).json({ message: "order Accepted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message || "Error encountered." });
  }
});

/**
 * @openapi
 * /partner/forms/{orderId}/{type}:
 *  post:
 *    summary: using this route partner ccreate jobcard and checkin card
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: orderId
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: type
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["jobcard", "checkin"]
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                jobCard:
 *                  type: array
 *                  items:
 *                    properties:
 *                      key:
 *                        type: string
 *                      value:
 *                        type: string
 *                checkIn:
 *                  type: array
 *                  items:
 *                    properties:
 *                      key:
 *                        type: string
 *                      value:
 *                        type: string
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

router.post("/forms/:orderId/:type", async (req, res) => {
  let { type, orderId } = req.params;

  const partnerId = req.partner._id;
  let { jobCard, checkIn } = req.body;

  if (!type || !orderId) {
    return res.status(500).json({ message: "type or orderId must be provided" });
  }

  if (!["jobcard", "checkin"].includes(type)) {
    return res
      .status(500)
      .json({ message: "type should be jobCard or checkin" });
  }

  try {
    const order = await Order.findOne({
      _id: orderId,
      Partner: partnerId,
    }).populate("OrderDetails.Items[0].ServiceId");

    if (!order) {
      return res
        .status(500)
        .json({ message: "order not exists or associated" });
    }

    if (type === "jobcard" && (!jobCard || jobCard.length === 0)) {
      return res.status(400).json({ message: "jobCard fields required" });
    }

    if (type === "checkin" && (!checkIn || checkIn.length === 0)) {
      return res.status(400).json({ message: "checkin fields required" });
    }

    if (type == "checkin") {
      console.log("hete")
      await orderMetaData.findOneAndUpdate(
        { orderId },
        { checkIn: checkIn },
        { new: true }
      );
      return res.status(200).json({ message: "form checkIn successfully" });
    }

    await orderMetaData.findOneAndUpdate(
      { orderId },
      { jobCard },
      { upsert: true }
    );

    await Order.findByIdAndUpdate(
      orderId,
      { Status: orderStatusTypesObj["InRepair"] },
      { new: true }
    );
    return res.status(200).json({ message: "Job card created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /partner/forms/{orderId}:
 *  get:
 *    summary: using this route partner get jobcard and checkin card
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
router.get("/forms/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { type } = req.query;

  if (!orderId) {
    return res
      .status(500)
      .json({ message: "type or orderId must be provided" });
  }

  if (type && !["jobcard", "checkin"].includes(type)) {
    return res
      .status(500)
      .json({ message: "type should be jobCard or checkin" });
  }

  try {
    const isFormExists = await orderMetaData.findOne({ orderId });

    if (!isFormExists) {
      return res.status(404).json({ message: "Job card not found" });
    }

    // if(type){
    //   if(type === "jobcard"){
    //     delete isFormExists['checkIn'];
    //     console.log(isFormExists)
    //     return res.status(200).json({ message: "jobcard forms", data: isFormExists });
    //   }
    //   else{
    //     delete isFormExists.jobCard;
    //     return res.status(200).json({ message: "checking form", data: isFormExists });
    //   }
    // }
    return res.status(200).json({ message: "forms", data: isFormExists });
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
  let emailData = null;
  const query = {};

  if (!status || !orderId) {
    return res
      .status(500)
      .json({ message: "orderId and status must be provided" });
  }

  const allowedStatus = [
    "InRepair",
    "completed",
    "Cancelled",
    "pickup",
    "delivered",
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(500).json({ message: "status is not allowed" });
  }

  try {
    const order = await Order.findOne({
      Partner: partnerId,
      OrderId: orderId,
    }).populate("Customer", "email Name");
    let first_name = order.Customer.Name ? order.Customer.Name : "Dear";

    if (!order) {
      return res
        .status(500)
        .json({ message: "order not belongs to this partner" });
    }

    if (order.Status === status) {
      return res.status(200).json({ message: "This is your current status" });
    }

    query['Status'] = status;

    if (status === "InRepair") {
      emailData = {
        Subject: "[Phixman] Order status E-mail",
        heading1: emailDatamapping["repairInProgress"].heading1,
        heading2: emailDatamapping["repairInProgress"].heading2,
        desc: `Hey ${first_name}, ` + emailDatamapping["repairInProgress"].desc,
        buttonName: emailDatamapping["repairInProgress"].buttonName,
        email: order.Customer.email || null,
      };
    } else if (status === "pickup") {
      emailData = {
        Subject: "[Phixman] Order status E-mail",
        heading1: emailDatamapping["pickUp"].heading1,
        heading2: emailDatamapping["pickUp"].heading2,
        desc: `Hey ${first_name}, ` + emailDatamapping["pickUp"].desc,
        buttonName: emailDatamapping["pickUp"].buttonName,
        email: order.Customer.email || null,
      };
    }
    else if (status === "completed") {
      // generate invoice id
      query['invoiceId'] = uuidv4();

      // create payout here
      await payout.createPayoutOnDb({ partnerId, orderId: order._id, totalAmount: order.OrderDetails.Amount, paymentMode: order.PaymentMode }, order.OrderDetails.Items[0].CategoryId);

    }
    else if (status === "delivered") {
      emailData = {
        Subject: "[Phixman] Order status E-mail",
        heading1: emailDatamapping["orderComplete"].heading1,
        heading2: emailDatamapping["orderComplete"].heading2,
        desc: `Hey ${first_name}, ` + emailDatamapping["orderComplete"].desc,
        buttonName: emailDatamapping["orderComplete"].buttonName,
        email: order.Customer.email || null,
      };
    }

    if (emailData && emailData.email) {
      commonMailFunctionToAll(data, "common");
    }

    await Order.findOneAndUpdate(
      { OrderId: orderId },
      {
        ...query,
        $push: { statusLogs: { status: status, timestampLog: new Date() } },
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ message: "order status chnages successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message || "Error encountered." });
  }
});

/**
 * @openapi
 * /partner/createSubProvider:
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
 *                name:
 *                  type: string
 *                categories:
 *                  type: array
 *                  items:
 *                    type: string
 *                    example: 630a2cd91fb0df4a3cb75593
 *                email:
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
 *    security:
 *    - bearerAuth: []
 */
router.post("/createSubProvider", async (req, response) => {
  try {
    if (!req?.body?.phone || !req?.body?.name || !req?.body?.categories) {
      return response.status(404).json({
        message: "missing required fields",
      });
    }
    const isPartnerExists = await Partner.findOne({ phone: req?.body?.phone });
    if (isPartnerExists) {
      return response.status(403).json({
        message: "partner with this number already exists",
        type: isPartnerExists.Type,
      });
    }
    const provider = await Partner.create({
      phone: req?.body?.phone,
      // uniqueReferralCode: generateRandomReferralCode(),
      Name: req?.body?.name,
      Type: "sub-provider",
      Product_Service: req?.body?.categories,
      isParent: req?.partner?._id,
      email: req?.body?.email ? req?.body?.email : "",
      isVerified: true,
      isApproved: true,
      isPublished: true,
      isProfileCompleted: false,
      isActive: true,
    });
    return response
      .status(201)
      .json({ message: "successfully created sub-provider", data: provider });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to create new sub provider",
    });
  }
});

/**
 * @openapi
 * /partner/deleteSubProvider/{sid}:
 *  delete:
 *    summary: Partner can delete sub-provider
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: sid
 *        required: true
 *        schema:
 *           type: string
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
 *    security:
 *    - bearerAuth: []
 */
router.delete("/deleteSubProvider/:sid", async (req, response) => {
  const partnerId = req?.partner?._id;
  const { sid } = req.params;

  try {
    const provider = await Partner.findOneAndDelete({
      _id: sid,
      isParent: partnerId,
    });
    if (provider) {
      return response
        .status(201)
        .json({ message: "sub-provider successfully deleted" });
    } else {
      return response
        .status(404)
        .json({ message: "no partner associated or not found" });
    }
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to create new sub provider",
    });
  }
});

/**
 * @openapi
 * /partner/createhelper:
 *  post:
 *    summary: used to create helper by individual member
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                email:
 *                  type: string
 *                avtar:
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
 *    security:
 *    - bearerAuth: []
 */
router.post("/createhelper", async (req, response) => {
  const partnerID = req?.partner?._id;
  const { name, email, avtar } = req.body;

  if (!email || !name || !avtar) {
    return response.status(404).json({
      message: "missing required fields",
    });
  }

  try {
    await Partner.findByIdAndUpdate(
      partnerID,
      { $push: { helpers: { name, email, avtar } } },
      { new: true }
    );

    return response
      .status(201)
      .json({ message: "successfully created helper" });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to create new sub provider",
    });
  }
});

/**
 * @openapi
 * /partner/deletehelper/{_id}:
 *  delete:
 *    summary: used to delete helper by individual member
 *    tags:
 *    - partner Routes
 *    parameters:
 *      - in: path
 *        name: _id
 *        required: true
 *        schema:
 *           type: string
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
 *    security:
 *    - bearerAuth: []
 */
router.delete("/deletehelper/:helperid", async (req, response) => {
  const partnerID = req?.partner?._id;
  const { helperid } = req.params;

  try {
    await Partner.findByIdAndUpdate(
      partnerID,
      { $pull: { helpers: { _id: helperid } } },
      { new: true }
    );

    return response
      .status(201)
      .json({ message: "helper successfully deleted" });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to create new sub provider",
    });
  }
});

/**
 * @openapi
 * /partner/buycredit:
 *  post:
 *    summary: used to intiate a transaction for adding credit.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                amount:
 *                  type: number
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
 *    security:
 *    - bearerAuth: []
 */
router.post("/buycredit", async (req, res) => {
  try {
    const tranId = commonFunction.genrateID("BUYCRED");
    const creditOrder = await Payment.initiateCreditOrder(
      tranId,
      req?.body?.amount,
      req?.partner?._id,
      req?.partner?.email ? req?.partner?.email : "example@phixman.in",
      req?.partner?.phone
    );
    return res.send(creditOrder);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered.",
    });
  }
});

/**
 * @openapi
 * /partner/verifycredit:
 *  post:
 *    summary: used to intiate a transaction for adding credit.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                tranId:
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
 *    security:
 *    - bearerAuth: []
 */
router.post("/verifycredit", async (req, res) => {
  try {
    const tranId = req?.body?.tranId;
    const transaction = await getWallletTransactionByTransactionId(tranId);
    if (transaction?.status && transaction?.status !== "pending") {
      return res.status(200).json({ status: transaction.status });
    }
    const verifyTransactionStatus = await Payment.verifyCreditOrder(
      transaction
    );
    return res.status(200).json({ status: verifyTransactionStatus?.status });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error encountered.",
    });
  }
});

/**
 * @openapi
 * /partner/wallet/transaction:
 *  get:
 *    summary: fetch all wallet transactions ordered by date
 *    tags:
 *    - partner Routes
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
router.get("/wallet/transaction", async (req, res) => {
  const id = req.partner._id;
  try {
    const data = await getAllWallletTranssactionForUser(id, "partner");
    return res.status(200).json({ message: "partner Transsaction list", data });
  } catch (error) {
    return res.status(500).json({
      message: error.message
        ? error.message
        : "Error encountered while trying to fetch transaction.",
    });
  }
});

/**
 * @openapi
 * /partner/initiateRecivePayment:
 *  post:
 *    summary: Initiate payment for recive
 *    tags:
 *    - partner Routes
 *    responses:
 *      500:
 *          description: if internal server error occured while performing request.
 *          content:
 *            application/json:
 *             schema:
 *               type: object
 *               properties:
 *                  paymentType:
 *                    type: string
 *                  orderId:
 *                    type: string
 *                  notifyMethod:
 *                    type: object
 *                    required: true
 *                    properties:
 *                     phone:
 *                      type: string
 *                     email:
 *                      type: string
 *    security:
 *    - bearerAuth: []
 */
router.post("/initiateRecivePayment", async (req, res) => {
  const { paymentType, orderId, notifyMethod } = req.body;
  const partnerId = req.partner._id;
  const paymentAcceptedType = ["self", "link", "qr"];

  if (!paymentAcceptedType.includes(paymentType)) {
    return res.status(400).json({ message: "Invalid paymentType" });
  }
  const generatedOrderId = commonFunction.genrateID("ORD");

  const id = req.partner._id;
  let notifyTo = null;

  if (notifyMethod["phone"]) {
    notifyTo = notifyMethod["phone"];
  } else {
    notifyTo = notifyMethod["email"];
  }

  try {
    const orderData = await Order.findOne({
      Partner: partnerId,
      OrderId: orderId,
    }).populate("Customer", "email Name");
    if (!orderData) {
      return res.status(400).json({ message: "invalid Order data not foound" });
    }

    const leftAmount =
      orderData["OrderDetails"]["Gradtotal"] -
      orderData["OrderDetails"]["paidamount"];

    if (paymentType === "self") {
      const orderData = await Order.findByIdAndUpdate(orderData._id, {
        $inc: { paidamount: leftAmount },
      });
      return res
        .status(200)
        .json({ message: "Order payment on cash successfull", data });
    } else if (paymentType === "link") {
      if (!notifyTo) {
        return res
          .status(400)
          .json({ message: "notifyMethod object required" });
      }

      let paymentObj = {
        customerid: customer._id,
        email: customer.email,
        phone: customer.phone,
        OrderId: generatedOrderId,
        Amount: leftAmount,
      };
      let cashfree = await Payment.createCustomerOrder(paymentObj);
      const paymentLink = cashfree.payment_link;

      // send link to user
      emailData = {
        Subject: "[Phixman] Order status E-mail",
        heading1: emailDatamapping["ppaymentLink"].heading1,
        heading2: emailDatamapping["ppaymentLink"].heading2,
        desc:
          `Hey ${first_name}, ` +
          emailDatamapping["ppaymentLink"].desc +
          ` <a href='${paymentLink}'>${paymentLink}</a>`,
        buttonName: emailDatamapping["ppaymentLink"].buttonName,
        email: order.Customer.email || null,
      };

      // commonMailFunctionToAll(data, "common");
      // sendOtp()
      return res.status(200).json({
        message: "Payment link successfully sent",
        paymentLink,
        transactionId: generatedOrderId,
      });
    } else if (paymentType === "qr") {
      return res.status(400).json({ message: "currently unavailable" });
    } else {
      return res
        .status(400)
        .json({ message: "Invalid payment initialization" });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message
        ? error.message
        : "Error encountered while trying to fetch transaction.",
    });
  }
});

/**
 * @openapi
 * /partner/verifypayment:
 *   post:
 *    summary: it's use to verify order payment status.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                transactionId:
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
router.post("/verifypayment", async (req, res) => {
  try {
    if (!req.body.transactionId) {
      return res.status(400).json({ message: "transactionId is required" });
    }
    const resp = await Payment.verifyCustomerOrder(req.body.transactionId);
    return res.status(200).json(resp);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /partner/reestimate:
 *  post:
 *    summary: it's use to re estimated order.
 *    tags:
 *    - partner Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
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
 *                OrderId:
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
 *                   Items:
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
router.post("/reestimate", rejectBadRequests, async (req, res) => {
  const { OrderId, Items } = req.body;
  console.log(Items);
  const partnerId = req.partner._id;

  if (!OrderId || Items.length === 0) {
    return res
      .status(400)
      .json({ message: "please provide OrderId and Items." });
  }

  let Amount = 0;
  let grandTotal = 0;

  Items.map((element) => (Amount += element?.Cost));
  grandTotal = Amount;

  try {
    const isorderExists = await Order.findOne({
      Partner: partnerId,
      _id: OrderId,
    });

    if (!isorderExists) {
      return res.status(400).json({ message: "order not found." });
    }
    console.log(isorderExists, "order");
    let update = await Order.findOneAndUpdate(
      { _id: OrderId, Partner: partnerId },
      {
        $inc: { "OrderDetails.Gradtotal": grandTotal },
        $inc: { "OrderDetails.Amount": Amount },
        $push: { "OrderDetails.Items": Items },
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ message: "Orders successfully reestimated." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


(async () => {
  // const {data} = await  payout.initiateCashfreePayout("JOHN18011343",2,"ifjifdddhjuifjfu","remark");
  // const resp = await payout.createPayoutOnDb({partnerId:"63737f86aef6566d1ad854ec",orderId:"63737f86aef6566d1ad854ec",totalAmount:100,paymentMode:"COD"});
  // console.log(resp);
})

module.exports = router;
