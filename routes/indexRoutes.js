const { param } = require("express-validator");
const { rejectBadRequests } = require("../middleware");
const { ProductType, Brand, Coupon, Product, Model } = require("../models");
const router = require("express").Router();

const getServiceParamValidators = [
  param("serviceType")
    .notEmpty()
    .withMessage("service type cannot be empty")
    .isIn(["home", "store"])
    .withMessage("service type is invalid"),
];

router.get("/", (_, res) => {
  return res.send(
    `<code>Server is running at PORT:${process.env.PORT}. Please refer to the api documentation <a href="/api-docs">here</a></code>`
  );
});

/**
 * @openapi
 * /products:
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
router.get("/products", rejectBadRequests, async (req, res) => {
  try {
    const products = await ProductType.find();
    return res.status(200).json(
      products.map((prod) => {
        return {
          name: prod.name,
          icon: prod.icon,
          key: prod.key,
          video: prod.video,
          modelRequired: prod.servedAt === "store" ? true : false,
        };
      })
    );
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});

/**
 * @openapi
 * /products/{serviceType}:
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
 *           enum: ["home","store"]
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
  "/products/:serviceType",
  ...getServiceParamValidators,
  rejectBadRequests,
  async (req, res) => {
    try {
      const products = await ProductType.find({
        servedAt: req?.params?.serviceType,
      });
      return res.status(200).json(
        products.map((prod) => {
          return {
            name: prod.name,
            icon: prod.icon,
            key: prod.key,
            video: prod.video,
            modelRequired: prod.servedAt === "store" ? true : false,
          };
        })
      );
    } catch (error) {
      return res.status(500).json({ message: "Error encountered." });
    }
  }
);

/**
 * @openapi
 * /Brands:
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
router.get("/Brands", async (req, res) => {
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
 * /Brands:
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
router.post("/Brands", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(500).json({ message: "name required" });
  }
  try {

    const isExistBrands = await Brand.findOne({ Name: name });

    if (isExistBrands) {
      return res.status(500).json({ message: "Brands already exist" });
    }

    const brands = new Brand({ Name: name });
    console.log(brands);
    const resp = await brands.save();
    return res.status(200).json({ message: "Brand added successfully", data: resp });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error encountered." });
  }
});


/**
 * @openapi
 * /models/{brandId}:
 *  get:
 *    summary: used to get all the models by brand id
 *    tags:
 *    - Index Routes
 *    parameters:
 *      - in: path
 *        name: brandId
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
 */
 router.get("/models/:id", async (req, res) => {
  if (!req.params.id) {
    return res.status(500).json({ message: "Brand id required." });
  }

  try {
    const models = await Model.find({brandId:req.params.id});
    return res.status(200).json({ message: "Models lists", data:models });
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
 *                modelName:
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
  const { brandId, modelName } = req.body;

  if (!brandId || !modelName) {
    return res.status(500).json({ message: "brandId and modelName are required" });
  }

  try {

    const isBrandExists = await Brand.findById(brandId);

    if (!isBrandExists) {
      return res.status(500).json({ message: "Brands not exist" });
    }

    const newmodel = new Model({ brandId, modelName });
    const resp = await newmodel.save();
    return res.status(200).json({ message: "Model created successfully", data: resp });
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
 * /devices:
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
router.get("/devices", async (req, res) => {
  try {
    const devices = await Product.find({});
    return res.status(200).json(devices);
  } catch (error) {
    return res.status(500).json({ message: "Error encountered." });
  }
});

module.exports = router;
