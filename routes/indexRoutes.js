const { param, body } = require("express-validator");
const path = require("path");
const { rejectBadRequests } = require("../middleware");
const { checkAdmin } = require("../middleware/AuthAdmin");
const {
  category,
  Brand,
  Coupon,
  Model,
  Product_Service,
  SystemInfo,
} = require("../models");
const router = require("express").Router();
const csv = require("csvtojson");
const { getParseModels } = require("../libs/commonFunction");
const fs = require("fs");
const { categoryTypes } = require("../enums/types");
const checkTokenOnly = require("../middleware/checkToken");

const getServiceParamValidators = [
  param("serviceType")
    .notEmpty()
    .withMessage("service type cannot be empty")
    .isIn(categoryTypes)
    .withMessage("service type is invalid"),
];

router.get("/", (_, res) => {
  return res.send(
    `<code>Server is running at PORT:${process.env.PORT}. Please refer to the api documentation <a href="/api-docs">here</a></code>`
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
 *    security:
 *    - bearerAuth: []
 */
router.get("/getCustomerByID/:id", async (req, res) => {
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
    const products = await category.find();
    const data = products.map((prod) => {
      prod["modelRequired"] = prod.key === "mobile" ? true : false;
      return prod;
    });
    return res.status(200).json(data);
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
 *           enum: ["Home service","Store service","Auto care","Neha’s personal care"]
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
      const products = await category.find({
        categoryType: "Home service",
      });
      console.log(products, req?.params?.serviceType);
      const data = products.map((prod) => {
        prod["modelRequired"] = prod.key === "mobile" ? true : false;
        return prod;
      });
      return res.status(200).json(data);
    } catch (error) {
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

    const isCategoryExists = await category.findById(categoryId);

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
 * /bulk/uploadcsvdata:
 *  post:
 *    summary: used to upload models and services
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
 *      - in: path
 *        name: csvfile
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
router.post("/bulk/uploadcsvdata", async (req, res) => {
  const { categoryId, brandId } = req.body;

  if (!categoryId || !brandId) {
    return res.status(500).json({ message: "categoryId brandId are required" });
  }

  try {
    const isCategoryExists = await category.findById(categoryId);

    if (!isCategoryExists) {
      return res.status(500).json({ message: "Category not exist" });
    }

    const isBrandExists = await Brand.findById(brandId);

    if (!isBrandExists) {
      return res.status(500).json({ message: "Brands not exist" });
    }

    const file = req.files.csvfile;

    // 1. concat name
    // 2. insert models
    // 3. apply validation
    // 4. insert services
    // 5. validation
    // 6. process all data

    if (!file) {
      return res.status(400).send("No files were uploaded.");
    }

    let filepath = path.join(__dirname, `../public/csv/${file.name}`);

    file.mv(filepath, async (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      const jsonArray = await csv().fromFile(filepath);
      const { modelsArr, services } = getParseModels(
        jsonArray,
        brandId,
        categoryId,
        isBrandExists.Name
      );

      Model.bulkWrite(
        modelsArr.map((ele) => ({
          updateOne: {
            filter: { modelId: ele.modelId },
            update: { $set: ele },
            upsert: true,
          },
        }))
      );

      Product_Service.bulkWrite(
        services.map((ele) => ({
          updateOne: {
            filter: { modelId: ele.modelId },
            update: { $set: ele },
            upsert: true,
          },
        }))
      );

      fs.unlinkSync(filepath);

      return res.send({
        status: "File data uploaded successfully",
        modelCount: modelsArr.length,
        servicesCount: services.length,
      });
    });
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
 *    security:
 *    - bearerAuth: []
 */
router.put("/:id", checkAdmin, async (req, res) => {
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
module.exports = router;
