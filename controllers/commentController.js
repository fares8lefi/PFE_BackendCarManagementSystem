const commentModel = require("../models/commentSchema");
const userModel = require("../models/userSchema");
const carModel = require("../models/carShema");
const mongoose = require("mongoose");
const notificationModel = require('../models/notificationSchema');

console.log('Serveur Node.js démarré');

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

    // Création et envoi de notification en temps réel
    if (populatedComment.carId?.userID?._id.toString() !== userId.toString()) {
      // Créer la notification avec tous les champs requis
      const notification = await notificationModel.create({
        recipient: populatedComment.carId.userID._id,
        type: "comment",
        content: `Nouveau commentaire sur votre ${populatedComment.carId.marque} ${populatedComment.carId.model}`,
        link: `/carDetaille/${carId}`,
        relatedCar: carId,
        relatedUser: userId
      });

      // Ajouter la notification à l'utilisateur
      await userModel.updateOne(
        { _id: populatedComment.carId.userID._id },
        { $push: { notifications: notification._id } }
      );

      // Envoyer la notification en temps réel via Socket.IO
      const io = req.io;
      if (io) {
        io.to(populatedComment.carId.userID._id.toString()).emit('newNotification', {
          notification: {
            _id: notification._id,
            type: notification.type,
            content: notification.content,
            link: notification.link,
            isRead: false,
            createdAt: notification.createdAt,
            relatedCar: {
              _id: populatedComment.carId._id,
              marque: populatedComment.carId.marque,
              model: populatedComment.carId.model
            },
            relatedUser: {
              _id: populatedComment.userId._id,
              username: populatedComment.userId.username
            }
          }
        });
      }
    }

    // Réponse formatée
    res.status(201).json({
      comment
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
};
// delete comment
module.exports.deleteComment = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const { commentId, carId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    if (!commentId || !carId) {
      return res.status(400).json({ message: "commentId et carId sont requis" });
    }

    // Vérifier que le commentaire existe et appartient à l'utilisateur
    const comment = await commentModel.findOne({ _id: commentId, userId: userId, carId: carId });
    if (!comment) {
      return res.status(404).json({ message: "Commentaire non trouvé ou non autorisé" });
    }

    // Suppression
    await commentModel.deleteOne({ _id: commentId });

    // Nettoyage des références
    await carModel.findByIdAndUpdate(carId, { $pull: { commentId: commentId } });
    await userModel.findByIdAndUpdate(userId, { $pull: { commentId: commentId } });

    res.status(200).json({ message: "Commentaire supprimé avec succès", commentId });
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

module.exports.updateComment = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const { commentId, content } = req.body;
    console.log("le content ===",content)
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Mise à jour directe avec findOneAndUpdate
    const updatedComment = await commentModel.findOneAndUpdate(
      { 
        _id: commentId, 
        userId: userId 
      },
      { 
        $set: { content: content } // Spécifier explicitement le champ à mettre à jour
      },
      { 
        new: true, // Retourner le document mis à jour
        runValidators: true // Exécuter les validateurs du schéma
      }
    );

    if (!updatedComment) {
      return res.status(404).json({ message: "Commentaire non trouvé ou non autorisé" });
    }

    res.status(200).json({ 
      message: "Commentaire modifié avec succès", 
      updatedComment 
    });
  } catch (error) {
    console.error("Erreur de mise à jour:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports.DeleteCommentByAdmin = async (req, res) => {
  try {
    const sessionUserId = req.session.user?._id;

    // Vérifier que l'utilisateur est connecté
    if (!sessionUserId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Récupérer l'utilisateur en base
    const user = await userModel.findById(sessionUserId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé : admin requis" });
    }

    const { commentId, carId, userId } = req.body;
    if (!commentId || !carId || !userId) {
      return res.status(400).json({ message: "commentId, carId et userId sont requis" });
    }

    // Vérifie que le commentaire existe
    const comment = await commentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    // Suppression du commentaire
    await commentModel.deleteOne({ _id: commentId });

    // Nettoyage des références
    await carModel.findByIdAndUpdate(carId, { $pull: { commentId: commentId } });
    await userModel.findByIdAndUpdate(userId, { $pull: { commentId: commentId } });

    res.status(200).json({ message: "Commentaire supprimé par l'admin", commentId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

