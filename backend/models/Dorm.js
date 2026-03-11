const mongoose = require("mongoose");

const dormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: String,
  block: String,
  roomType: String,
  seatCount: Number,
  price: Number,
  amenities: [String],
  availability: Boolean,
});

module.exports = mongoose.model("Dorm", dormSchema);
