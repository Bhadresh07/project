//jshint esversion:6
var mongoose = require("mongoose");

const revSchema = mongoose.Schema({
  cname: {
    type: String,
    required: true,
  },
  batch: {
    type: Number,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  title: {
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
  review: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("Review", revSchema);
