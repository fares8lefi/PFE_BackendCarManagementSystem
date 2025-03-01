const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true  },
},
{ timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
