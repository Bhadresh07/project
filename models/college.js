//jshint esversion:6
const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
  cname: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  course: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    required: true,
  },
  author: {
     id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
     },
     username: String
  },
  validity: {
    type: Boolean,
    default:false,
  }
});
const College = module.exports = mongoose.model("College", collegeSchema);
