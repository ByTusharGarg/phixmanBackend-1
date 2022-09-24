const router = require("express").Router();
const { rejectBadRequests } = require("../middleware");
const { body } = require("express-validator");
const { generateOtp, sendOtp } = require("../libs/otpLib");
const { Partner, Wallet, Order, orderMetaData } = require("../models");
const checkPartner = require("../middleware/AuthPartner");
const { orderStatusTypes } = require("../enums/types");
const tokenService = require("../services/token-service");
const validateTempToken = require("../middleware/tempTokenVerification");

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
router.post(
  "/SendOTP",
  ...sendOtpBodyValidator,
  rejectBadRequests,
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
      const isWalletExixts = await Wallet.findOne({ partnerId: partner?._id });
      if (!isWalletExixts) {
        const newWallet = new Wallet({ partnerId: partner?._id });
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
 *            aadharNumber:
 *              type: string
 *              required: true
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
    address,
    Dob,
    Type,
    Product_Service,
    email,
    gender,
    panNumber,
    aadharNumber,
    secondaryNumber,
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
    if (Type === "individual") {
      return res.status(404).json({
        message: "pancard documents required",
      });
    }

    images.push(undefined);
    docs["pan"] = null;
  }

  if (Type === "store" && !gstCertificate) {
    return res.status(404).json({
      message: "gstCertificate documents required",
    });
  } else {
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
  }

  if (Type === "individual" && !expCertificate) {
    return res
      .status(404)
      .json({ message: "expCertificate documents required" });
  } else {
    docs["expCertificate"] = expCertificate ? randomImageName() : null;

    if (expCertificate) {
      images.push({ ...expCertificate, fileName: randomImageName() });
    } else {
      images.push(undefined);
    }
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
          Dob,
          Type,
          Product_Service: JSON.parse(Product_Service),
          email,
          gender,
          address: JSON.parse(address),
          isProfileCompleted: true,
          aadhar: {
            number: aadharNumber,
            fileF: images[0].fileName,
            fileB: images[1].fileName,
          },
          secondaryNumber,
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
    const profile = await Partner.findById(partnerId);

    profile["aadhar"]["fileF"] = await getObjectSignedUrl(
      profile?.aadhar?.fileF
    );
    profile["aadhar"]["fileB"] = await getObjectSignedUrl(
      profile?.aadhar?.fileB
    );
    profile["expCertificate"] = await getObjectSignedUrl(
      profile?.expCertificate
    );

    return res.status(200).json({ message: "user profile.", data: profile });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while trying to fetching profile." });
  }
  return res.status(200).json(req?.partner);
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
 *                name:
 *                  type: string
 *                dob:
 *                  type: string
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
 *                    cood:
 *                      type: object
 *                      properties:
 *                        lattitude:
 *                          type: string
 *                        longitude:
 *                          type: string
 *                image:
 *                  type: file
 *                panNumber:
 *                  type: string
 *                pan:
 *                  type: file
 *                aadharNumber:
 *                  type: string
 *                aadhar:
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
router.patch(
  "/changeprofile",
  ...updatePartnerValidator,
  rejectBadRequests,
  async (req, res) => {
    try {
      let update = req?.body;
      update.isVerified = true;
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
        update.image = "";
      }
      await Partner.findByIdAndUpdate(req.partner._id, update, { new: true });
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

  if (status !== "all") {
    query["Status"] = status;
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
    queryobj["address.pin"] = pincode;
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

    if (order.Status !== "Requested") {
      return res
        .status(204)
        .json({ message: "order already Accepted or further processing" });
    }

    await Order.findOneAndUpdate(
      { OrderId: orderId },
      { Status: orderStatusTypes[2], Partner: partnerId },
      { new: true }
    );
    return res.status(200).json({ message: "order Accepted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /partner/forms/:orderId/:typs:
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
 *        name: typs
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["jobcard", "checkin"]
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
  let { jobcard, checkin } = req.body;

  let images = [];

  // let daojioj = { key: "component", value: ["ishiss", "jiiji"] }


  // checkin.push(daojioj);

  const { phoneImages, selfieWithproduct, signature, helpers } = req.files;

  if (!type || !orderId) {
    return res.status(500).json({ message: "type or orderId must be provided" });
  }

  // if (jobcard.length === 0) {
  //   return res.status(500).json({ message: "Data is not provided" });
  // }

  if (!["jobcard", "checkin"].includes(type)) {
    return res.status(500).json({ message: "type should be jobCard or checkin" });
  }

  if (signature) {
    let sign = randomImageName();
    images.push({ ...signature, fileName: sign });
    jobcard.push({ key: "signature", value: sign })
  }
  if (selfieWithproduct) {
    let selfieP = randomImageName();
    images.push({ ...selfieWithproduct, fileName: selfieP });
    jobcard.push({ key: "selfieWithproduct", value: selfieP })
  }

  if (phoneImages && phoneImages.length > 0) {
    let value = [];
    phoneImages.map((file, i) => {
      let pName = randomImageName();
      images.push({ ...file, fileName: pName });
      value.push(pName);
    })
    jobcard.push({ key: "phoneImages", value })
  }


  if (helpers && Chelpers.length > 0) {
    let value = [];
    helpers.map((file, i) => {
      let pName = randomImageName();
      images.push({ ...file, fileName: pName });
      value.push(pName);
    })
    jobcard.push({ key: "helpers", value })
  }


  try {
    const isFormExists = await orderMetaData.findOne({ orderId });
    if (isFormExists) {
      if (type === "jobcard") {
        return res.status(500).json({ message: "Jobcard allready exists plese delete previous one" });
      }

      await orderMetaData.findOneAndUpdate({ orderId }, { checkIn: checkin }, { new: true });
      return res.status(200).json({ message: "phone checkin successfully" });
    }


    if (images.length > 0) {
      await Promise.all(
        images.map((file, i) => {
          if (file) {
            return uploadFile(file.data, file.fileName, file.mimetype);
          } else {
            return;
          }
        })
      );
    }

    const order = await Order.findOne({ _id: orderId, Partner: partnerId })
      .populate("OrderDetails.Items[0].ServiceId");

    if (!order) {
      return res.status(500).json({ message: "order not exists or associated" });
    }

    const newData = new orderMetaData({ orderId, jobCard: jobcard });
    await newData.save();

    if (order.Status === orderStatusTypes[2]) {
      await Order.findByIdAndUpdate(orderId,
        { Status: orderStatusTypes[3] },
        { new: true }
      );
    }
    return res.status(200).json({ message: "Job card created successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /partner/forms/:orderId:
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

  try {
    const isFormExists = await orderMetaData.findOne({ orderId });

    if (!isFormExists) {
      return res.status(404).json({ message: "Job card not found" });
    }

    return res.status(200).json({ message: "Job card created successfully", data: isFormExists });
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
    return res
      .status(500)
      .json({ message: "orderId and status must be provided" });
  }

  const allowedStatus = ["InRepair", "completed", "Cancelled"];

  if (!allowedStatus.includes(status)) {
    return res.status(500).json({ message: "status is not allowed" });
  }

  try {
    const order = await Order.findOne({ Partner: partnerId, OrderId: orderId });

    if (!order) {
      return res
        .status(500)
        .json({ message: "order not belongs to this partner" });
    }

    if (order.Status === status) {
      return res.status(200).json({ message: "This is your current status" });
    }

    await Order.findOneAndUpdate(
      { OrderId: orderId },
      { Status: status },
      { new: true }
    );
    return res.status(200).json({ message: "order status changes" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
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
    console.log(isPartnerExists);
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
module.exports = router;
