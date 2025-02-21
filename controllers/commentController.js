const commentModel = require("../models/commentSchema");
const userModel = require("../models/userSchema");
const carModel = require("../models/carShema");

module.exports.addComment = async (req, res) => {
  try {
    const { content, userId, carId } = req.body;

    const checkUser = await userModel.findById(userId);
    if (!checkUser) {
      console.log("user not found ");
    }
    const checkCar = await carModel.findById(carId);
    if (!checkCar) {
      console.log("car not found");
    }
    const comment = await commentModel.create({
      content: content,
      userId: checkUser,
      carId: checkCar,
    });
    res.status(200).json({ comment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
