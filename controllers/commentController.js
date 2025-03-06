const commentModel = require("../models/commentSchema");
const userModel = require("../models/userSchema");
const carModel = require("../models/carShema");
const mongoose = require("mongoose");

module.exports.addComment = async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (!userId) return res.status(401).json({ message: "Non authentifié" });

    const { content, carId } = req.body;
    // Création du commentaire
    const comment = await commentModel.create({ content, userId, carId });

    const createComment = await commentModel.findById(comment._id).populate({
      path: "userId",
      select: "username ",
    });

    //update els relations
    await Promise.all([
      carModel.findByIdAndUpdate(carId, {
        $push: { comments: comment._id },
      }),
      userModel.findByIdAndUpdate(userId, {
        $push: { comments: comment._id },
      }),
    ]);

    res.status(201).json(createComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete comment
module.exports.deleteComment = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { commentId, carId } = req.body;
    if (!userId) {
      res.status(200).json({ message: "user non authentifié" });
    }
    const deletedComment = await commentModel.findOneAndDelete({
      _id: commentId, // Vérifie l'ID du commentaire
      user: userId, // Vérifie l'auteur du commentaire
      car: carId, // Vérifie la voiture associée
    });
    res.status(200).json({ deletedComment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get allcomments
module.exports.getCommentsByCar = async (req, res) => {
  try {
    const { carId } = req.params;

    const comments = await commentModel
      .find({ carId })
      .populate({
        path: "userId",
        select: "username  createdAt",
      })
      .sort({ createdAt: -1 }); // le plus nouveau affichele premier

    res.status(200).json({ comments });
  } catch (error) {
    res.status(200).json({ message: error.message });
  }
};

