const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true  },
  link: {
    type: String,
    required: false
  },
},
{ timestamps: true }
);
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
