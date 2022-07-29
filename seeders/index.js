require("dotenv").config();
const seeder = require("mongoose-seed");
const adminSeeders = require("./adminSeeders");
const brandSeeders = require("./brandSeeders");
// const productSeeders = require("./productSeeders");
const categorySeeder = require("./categorySeeder");

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
    seeder.loadModels([
      "./models/category.js",
      "./models/Admin.js",
      "./models/Brand.js",
      "./models/Model.js",
    ]);

    // Clear specified collections
    seeder.clearModels(
      ["category", "Admin", "Brand", "Model"],
      function () {
        // Callback to populate DB once collections have been cleared
        seeder.populateModels(data, function () {
          seeder.disconnect();
        });
      }
    );
  }
);

// Data array containing seed data - documents organized by Model
const data = [categorySeeder, adminSeeders, brandSeeders];
