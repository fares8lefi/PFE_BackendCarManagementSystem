const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["comment", "sale", "view", "status_change", "admin"],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  link: {
    type: String,
  },
  relatedCar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "carModel"
  },
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
