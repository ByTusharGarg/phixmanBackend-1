require("dotenv").config();
const Express = require("express");
const Fingerprint = require("express-fingerprint");
const UserAgent = require("express-useragent");
const rateLimit = require("express-rate-limit");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUiExpress = require("swagger-ui-express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const router = require("./routes/router");
const connect = require("./connect");
const payout = require('./libs/payments/payouts');
// Configure Express app.
const app = Express();

// setting template engin
app.set("view engine", "ejs");

// swagger documentation

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Phixman API",
      description: "Phixman API documentation.",
      contact: {
        name: "API Support",
        email: "tushar.garg@phixman.in",
      },
      license: {
        name: "Proprietary",
        url: "https://en.wikipedia.org/wiki/Proprietary_software",
      },
      servers: [process.env.backendUrl],
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    servers: [
      {
        url: "http://localhost:8000/",
        name: "localhost",
      },
      {
        url: "http://phixman.in/api/",
        name: "UAT server",
      },
    ],
  },
  apis: ["./routes/*.js"], // files containing annotations as above
};

const docs = swaggerJsdoc(options);
app.use("/docs", swaggerUiExpress.serve, swaggerUiExpress.setup(docs));

//data Parsers
app.use(
  Express.urlencoded({
    extended: true,
  })
);

app.use(Express.static(path.join(__dirname, "public")));

// Configure Express to accepting JSON request bodies upto 50MB.
// app.use(Express.json({ limit: "50mb" }));
app.use(Express.json());
app.use(
  fileUpload({
    // limits: { fileSize: 1 * 1024 * 1024 }, // 1 MB
    useTempFiles: false, // flag for use temporary directory for handling file coming through api requests
    tempFileDir: "/tmp/", // temporary directory for handling file coming through api requests
    abortOnLimit: true, // abort api request if the incoming file size is larger then the specified size
    createParentPath: true,
  })
);

// Filter requests for security
app.use(cors());
app.use(helmet());
app.use(UserAgent.express()); // Use express-useragent to expose user agent details in request.
app.use(Fingerprint()); // Use express-fingerprint to fingerprint connecting client devices (used in token validation/invalidation).
app.use(
  morgan("combined", {
    stream: fs.createWriteStream(path.resolve("access.log"), {
      flags: "a",
    }),
  })
);
app.use(
  rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs
  })
);

// connect to db
connect();

// routes
app.use("/", router.indexRoutes);
app.use("/customer", router.customerRoutes);
app.use("/partner", router.partnerRoutes);
app.use("/admin", router.adminRoutes);
app.use("/Order", router.orderRoutes);
app.use("/wallet", router.walletRoutes);
app.use("/customerpayment", router.customerPaymentRoutes);
app.use("/coupen", router.coupenRoutes);
app.use("/notification", router.notificationRoutes);
app.use("/feedback", router.feedbackRoutes);
app.use("/payouts", router.payoutsRoutes);


// const server = https.createServer({}, app);
app.listen(process.env.PORT, function (err) {
  if (err) {
    console.log(err);
  }
  console.log("Express Server Running at PORT: " + process.env.PORT);
});
