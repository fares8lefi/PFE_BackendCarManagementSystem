const commentModel = require("../models/commentSchema");
const userModel = require("../models/userSchema");
const carModel = require("../models/carShema");

module.exports.addComment = async (req, res) => {
  try {
    const { content, userId, carId } = req.body;

    const User = await userModel.findById(userId);
    if (!User) {
      console.log("user not found ");
    }
    const Car = await carModel.findById(carId);
    if (!Car) {
      console.log("car not found");
    }
    const comment = await commentModel.create({
      content: content,
      userId: User,
      carId: Car,
    });
    res.status(200).json({ comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
