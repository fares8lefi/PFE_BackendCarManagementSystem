const mongoose = require("mongoose");

const commentShema = new mongoose.Schema(
  {
    content: { type: String },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentShema);
module.exports = Comment;
