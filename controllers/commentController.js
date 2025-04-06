const commentModel = require("../models/commentSchema");
const userModel = require("../models/userSchema");
const carModel = require("../models/carShema");
const mongoose = require("mongoose");
const notificationModel = require('../models/notificationSchema');

module.exports.addComment = async (req, res) => {
  try {
    
    const userId = req.session.user?._id;
    //vericfie des données
    const { content, carId } = req.body;
    if (!content || !carId) {
      return res.status(400).json({ message: "Contenu et ID de voiture requis" });
    }

    const comment = await commentModel.create({ 
      content,
      userId,
      carId 
    });

    // les relations
    const populatedComment = await commentModel.findById(comment._id)
      .populate({
        path: 'userId',
        select: 'username',
        model: 'User' 
      })
      .populate({
        path: 'carId',
        model: 'carModel',
        populate: {
          path: 'userID',
          model: 'User'
        }
      });

   
    await Promise.all([
      carModel.findByIdAndUpdate(carId, { 
        $push: { commentId: comment._id } 
      }),
      userModel.findByIdAndUpdate(userId, { 
        $push: { commentId: comment._id }
      })
    ]);

    // craeaion du notifications
    if (populatedComment.carId?.userID?._id.toString() !== userId.toString()) {
      await notificationModel.create({
        content: `Nouveau commentaire sur votre ${populatedComment.carId.marque} ${populatedComment.carId.model}`,
        recipient: populatedComment.carId.userID._id 
      });
    }

    // 7. Réponse formatée
    res.status(201).json({
      comment
    });

  } catch (error) {
    res.status(500).json({ message: error.message })
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
      _id: commentId, 
      user: userId, 
      car: carId, 
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
        select: "username user_image createdAt",
      })
      .sort({ createdAt: -1 });

    // Conversion du buffer en Base64 pour chaque image utilisateur
    const commentsList = comments.map((comment) => {
      const commentObj = comment.toObject();
      if (commentObj.userId && commentObj.userId.user_image) {
        // Vérifier si c'est un objet 
        if (commentObj.userId.user_image.data && commentObj.userId.user_image.contentType) {
          commentObj.userId.user_image = 
            `data:${commentObj.userId.user_image.contentType};base64,` +
             commentObj.userId.user_image.data.toString("base64");
        } 
        // Sinon, si c'est juste un Buffer 
        else {
          commentObj.userId.user_image = 
            "data:image/jpg;base64," + 
            commentObj.userId.user_image.toString("base64");
        }
      }
      return commentObj;
    });

    res.status(200).json({ comments: commentsList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

