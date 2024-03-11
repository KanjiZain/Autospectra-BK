
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  uname: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  wishlist: [{ carName: String }],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
