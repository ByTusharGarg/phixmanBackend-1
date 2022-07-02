const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  video: String,
  icon: String,
  name: { type: String, unique: true },
  key: String,
  servedAt: String,
});

const category = mongoose.model("category", categorySchema);

module.exports = category;
