const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CarSchema = new mongoose.Schema({
  brand: String,
  bodyType: String,
  carName: String,
  transmission: String,
  fuelType: String,
  totalprice: String,
  year: Number,
  description: String,
  images: [
    {
      filename: String,
      base64: String,
    },
  ],
});

const Car = mongoose.model("Car", CarSchema);

module.exports = Car;
