const { param, body } = require("express-validator");
const { rejectBadRequests } = require("../middleware");
const { checkAdmin } = require("../middleware/AuthAdmin");
const {
  category,
  Brand,
  Coupon,
  Model,
  Product_Service,
  SystemInfo,
  Partner,
  Order
} = require("../models");
const router = require("express").Router();
const fs = require("fs");
const { categoryTypes } = require("../enums/types");
const checkTokenOnly = require("../middleware/checkToken");
const {
  categoryTypesOptionsArray,
  CategoryTypeOptions,
} = require("../enums/CategoryTypesOptions");
const checkPartner = require('../middleware/AuthPartner');
const moment = require("moment");
const pdf = require("pdf-creator-node");
const path = require("path");

const getServiceParamValidators = [
  param("serviceType")
    .notEmpty()
    .withMessage("service type cannot be empty")
    .isIn(categoryTypesOptionsArray)
    .withMessage("service type is invalid"),
];

router.get("/", (_, res) => {
  return res.send(
    `<code>Server is running at PORT:${process.env.PORT}. Please refer to the api documentation <a href="http://phixman.in/api/docs">here</a></code>`
  );
});

// router.use(checkTokenOnly);

/**
 * @openapi
 * /getCustomerByID/{_id}:
 *  get:
 *    summary: used to fetch a specific customer by _id.
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: _id
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
 */
router.get("/getCustomerByID/:id", checkTokenOnly, async (req, res) => {
  const id = req.params.id;
  try {
    const orders = await Customer.findById(id);
    return res.status(200).json({ message: "customer details", data: orders });
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /getSubProvidersByStoreID/{_id}:
 *  get:
 *    summary: used to fetch list of sub providers by store id.
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: _id
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
 */
router.get("/getSubProvidersByStoreID/:_id", async (req, res) => {
  try {
    let providers = await Partner.find({ isParent: req?.params?._id }).populate(
      "Product_Service"
    );
    return res.status(200).json(providers);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /subprovider/mystoredetails:
 *  get:
 *    summary: My store details
 *    tags:
 *    - Index Routes
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
router.get("/subprovider/mystoredetails", checkPartner, async (req, response) => {
  const { Type, isParent } = req.partner;

  if (Type !== 'sub-provider') {
    return response.status(400).json({
      message: "You are not allowed",
    });
  }

  try {
    const partnerDetails = await Partner.findById(isParent);

    if (!partnerDetails) {
      return response.status(400).json({
        message: "no store found store",
      });
    }

    return response.status(200).json({ message: "sub-provider store details", data: partnerDetails });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Error encountered while trying to fetching sub provider store",
    });
  }
});


/**
 * @openapi
 * /myhelpers:
 *  get:
 *    summary: My helpers details
 *    tags:
 *    - Index Routes
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
router.get("/myhelpers", checkPartner, async (req, res) => {
  const partnerId = req.partner._id;
  try {
    let data = await Partner.findById(partnerId);
    return res.status(200).json({ message: "helpers details", data: data['helpers'] });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /categories:
 *  get:
 *    summary: lists all product categories available
 *    tags:
 *    - Index Routes
 *    responses:
 *      200:
 *          description: if successfully fetch all product types or categories.
 *          content:
 *            application/json:
 *             schema:
 *               type: array
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
router.get("/categories", rejectBadRequests, async (req, res) => {
  try {
    const products = await category
      .find({ isDeleted: false })
      .populate("forms.features");

    return res.status(200).json(products);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /category/{serviceType}:
 *  get:
 *    summary: lists all product categories available served at a specific place
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: serviceType
 *        required: true
 *        schema:
 *           type: string
 *           enum: ["Home_service","Store_service","Auto_care","npc"]
 *    responses:
 *      200:
 *          description: if successfully fetch all product types.
 *          content:
 *            application/json:
 *             schema:
 *               type: array
 *               description: list of all the product types available for store service.
 *               items:
 *                type: object
 *                properties:
 *                  name:
 *                   type: string
 *                  icon:
 *                   type: string
 *                  key:
 *                   type: string
 *                  video:
 *                   type: string
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
router.get(
  "/category/:serviceType",
  ...getServiceParamValidators,
  rejectBadRequests,
  async (req, res) => {
    try {
      req.params.serviceType = CategoryTypeOptions[req.params.serviceType];
      const products = await category
        .find({
          categoryType: req?.params?.serviceType,
          isDeleted: false,
        })
        .populate("forms.features");

      return res.status(200).json(products);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error encountered." });
    }
  }
);

/**
 * @openapi
 * /brands:
 *  post:
 *    summary: used to add brands.
 *    tags:
 *    - Index Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  description: required
 *                brandId:
 *                  type: string
 *                  description: required
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
router.post("/brands", async (req, res) => {
  const { name, brandId } = req.body;

  if (!name || !brandId) {
    return res.status(500).json({ message: "name and brandId required" });
  }
  try {
    const isExistBrands = await Brand.findOne({ Name: name, brandId });

    if (isExistBrands) {
      return res.status(500).json({ message: "Brands already exist" });
    }

    const brands = new Brand({ Name: name, brandId });
    const resp = await brands.save();
    return res
      .status(200)
      .json({ message: "Brand added successfully", data: resp });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /brands:
 *  get:
 *    summary: used to get list of brands.
 *    tags:
 *    - Index Routes
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
router.get("/brands", async (req, res) => {
  try {
    const brands = await Brand.find({});
    return res.status(200).json(brands);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /models:
 *  post:
 *    summary: used to add Models.
 *    tags:
 *    - Index Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                brandId:
 *                  type: string
 *                  description: required
 *                categoryId:
 *                  type: string
 *                  description: required
 *                modelName:
 *                  type: string
 *                  description: required
 *                modelId:
 *                  type: string
 *                  description: required
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
router.post("/models", async (req, res) => {
  const { brandId, categoryId, modelName, modelId } = req.body;

  if (!brandId || !modelName || !modelId || !categoryId) {
    return res
      .status(500)
      .json({ message: "brandId modelName and  phoneId are required" });
  }

  try {
    const isBrandExists = await Brand.findById(brandId);

    if (!isBrandExists) {
      return res.status(500).json({ message: "Brands not exist" });
    }

    const isCategoryExists = await category.findById({
      _id: categoryId,
      isDeleted: false,
    });

    if (!isCategoryExists) {
      return res.status(500).json({ message: "Category not exist" });
    }

    const newmodel = await Model.findOneAndUpdate(
      { brandId },
      { brandId, Name: modelName, modelId, categoryId },
      { new: true, upsert: true }
    );

    // const newmodel = new Model({ brandId, Name: modelName, modelId, categoryId });

    const resp = await newmodel.save();
    return res
      .status(200)
      .json({ message: "Model created successfully", data: resp });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /models/{categoryId}/{brandId}:
 *  get:
 *    summary: used to get all the models by category and brandid
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: categoryId
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: brandId
 *        required: true
 *        schema:
 *           type: string
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
router.get("/models/:categoryId/:brandId", async (req, res) => {
  const { categoryId, brandId } = req.params;

  if (!categoryId || !brandId) {
    return res.status(500).json({ message: "categoryId brandId are required" });
  }

  try {
    const models = await Model.find({ categoryId, brandId });
    return res.status(200).json({ message: "Models lists", data: models });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /services/{categoryId}:
 *  get:
 *    summary: get all services for specific category
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: categoryId
 *        required: true
 *        schema:
 *           type: string
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
router.get("/services/:categoryId", async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId) {
    return res.status(500).json({ message: "categoryId is required" });
  }

  try {
    let filter = { ispublish: true };
    if (categoryId) filter.categoryId = categoryId;
    const services = await Product_Service.find(filter);
    return res.status(200).json({ message: "Models lists", data: services });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /services/{categoryId}/{modelid}:
 *  get:
 *    summary: get all services for specific category
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: categoryId
 *        required: true
 *        schema:
 *           type: string
 *      - in: path
 *        name: modelid
 *        schema:
 *           type: string
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
router.get("/services/:categoryId/:modelid", async (req, res) => {
  const { modelid, categoryId } = req.params;

  if (!categoryId) {
    return res.status(500).json({ message: "categoryId is required" });
  }

  try {
    let filter = { ispublish: true };

    if (modelid) filter.modelId = modelid;
    if (categoryId) filter.categoryId = categoryId;

    const services = await Product_Service.find(filter);
    return res.status(200).json({ message: "Models lists", data: services });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /services/{_id}:
 *  put:
 *    summary: admin can use this route to update an service by _id.
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: _id
 *        required: true
 *        schema:
 *           type: string
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *              type: object
 *              properties:
 *                serviceName:
 *                  type: string
 *                cost:
 *                  type: number
 *                categoryId:
 *                  type: number
 *                modelId:
 *                  type: number
 *                ispublish:
 *                  type: boolean
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
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Product_Service.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    return res.status(200).json(order);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /Offers:
 *  get:
 *    summary: used to list all active Coupons.
 *    tags:
 *    - Index Routes
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
router.get("/Offers", async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    return res.status(200).json(coupons);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /settings:
 *  get:
 *    summary: used to get system settings.
 *    tags:
 *    - Index Routes
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
router.get("/settings", async (req, res) => {
  try {
    const info = await SystemInfo.findOne();
    return res.status(200).json(info);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /generateinvoice:
 *  post:
 *    summary: generate invoice of customer order
 *    tags:
 *    - Index Routes
 *    requestBody:
 *      content:
 *        application/json:
 *          orderid:
 *              type: string
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
 router.post("/generateinvoice",checkTokenOnly, async (req, res, next) => {
  const { orderid } = req.body;

  if(!orderid) {
    return res.status(400).json({ message: "order required" });
  }

  const html = fs.readFileSync(
    path.join(__dirname, "../libs/mailer/template/invoice.html"),
    "utf-8"
  );
  let orderData = null;

  const filename = Math.random() + "_doc" + ".pdf";

  try {
    orderData = await Order.findById(orderid)
      .populate("OrderDetails.Items.ServiceId")
      .populate("Customer")
      .populate("Partner");

    if (!orderData) {
      return res.status(404).json({ message: "order not found" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while finding orders pdf." });
  }

  let array = [];
  orderData.OrderDetails.Items.map((ele) => {
    array.push({ serviceName: ele.ServiceId.serviceName })
  })

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
      name: orderData?.Customer?.Name || "N/A",
      gst: "N/A",
      invoiceNum: orderData.invoiceId,
      address: `${orderData.address.street} ${orderData.address.city} ${orderData.address.state} ${orderData.address.country} ${orderData.address.pin}`,
      date: orderData.Date,
      sNc: `${orderData.address.state} & ${orderData.address.pin}`,
      placeOfSupply: orderData.address.country || "N/A",
    },
    partner: {
      bName: orderData.Partner?.Name || "N/A",
      bGst: "N/A",
      bAddress: `${orderData?.address.street} ${orderData?.address.city} ${orderData.address.state} ${orderData.address.country} ${orderData.address.pin}`,
      sNc: `${orderData.address.state} ${orderData.address.country} & ${orderData.address.pin}`,
    },
  };

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
    const data = await pdf.create(document, options);

    res.setHeader("Content-disposition", 'inline; filename="test.pdf"');
    res.setHeader("Content-type", "application/pdf");

    var fileData = fs.readFileSync(data.filename);

    let interval = setTimeout(() => {
      fs.unlink(data.filename, () => { });
      clearInterval(interval);
    }, 3000);

    return res.send(fileData);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error encountered while generating pdf." });
  }
});
module.exports = router;
