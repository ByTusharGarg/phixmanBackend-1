require("dotenv").config();
const seeder = require("mongoose-seed");
const adminSeeders = require("./adminSeeders");
const productTypeSeeder = require("./productTypeSeeder");

// Connect to MongoDB via Mongoose
seeder.connect(
  process.env.DB,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  function () {
    // Load Mongoose models
    seeder.loadModels(["./models/ProductType.js", "./models/Admin.js"]);

    // Clear specified collections
    seeder.clearModels(["ProductType", "Admin"], function () {
      // Callback to populate DB once collections have been cleared
      seeder.populateModels(data, function () {
        seeder.disconnect();
      });
    });
  }
);

// Data array containing seed data - documents organized by Model
const data = [productTypeSeeder, adminSeeders];
