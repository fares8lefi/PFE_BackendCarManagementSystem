const Notification = require("../models/notificationSchema");
const User = require("../models/userSchema");

// Fonction utilitaire pour l'émission de notifications par WebSocket
const emitNotification = (io, userId, notification) => {
  // S'assurer que l'objet est sérialisable (convertir depuis Mongoose)
  const rawNotification = notification.toObject ? notification.toObject() : notification;
  
  // Formater la notification pour le frontend
  const formattedNotification = {
    ...rawNotification,
    _id: rawNotification._id.toString(), // Conversion explicite de l'ObjectId
    recipient: rawNotification.recipient.toString(),
    createdAt: rawNotification.createdAt.toISOString(),
    updatedAt: rawNotification.updatedAt.toISOString()
  };
  
  // Si relatedCar et relatedUser existent, convertir leurs IDs aussi
  if (formattedNotification.relatedCar) {
    formattedNotification.relatedCar = formattedNotification.relatedCar.toString();
  }
  
  if (formattedNotification.relatedUser) {
    formattedNotification.relatedUser = formattedNotification.relatedUser.toString();
  }
  
  // Émettre l'événement WebSocket
  io.to(userId.toString()).emit('newNotification', {
    notification: formattedNotification,
    type: 'new'
  });
};

module.exports.createNotification = async (req, res) => {
  try {
    const { recipient, type, content, link, relatedCar, relatedUser } = req.body;
    const io = req.app.get('io');

    const notification = new Notification({
      recipient,
      type,
      content,
      link,
      relatedCar,
      relatedUser
    });

    const newNotification = await notification.save();

    // Ajouter la notification à l'utilisateur
    await User.updateOne(
      { _id: recipient },
      { $push: { notifications: newNotification._id } }
    );

    // Utiliser notre nouvelle fonction pour émettre la notification
    emitNotification(io, recipient, newNotification);

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//duffisions
module.exports.broadcastNotifToAll = async (req, res) => {
  try {
    const { content } = req.body;
    const io = req.app.get('io');

    // Validation des données
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le contenu de la notification est requis"
      });
    }

    // Récupérer tous les utilisateurs actifs
    const users = await User.find(
      { status: 'Active' },
      "_id username email"
    ).lean();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur actif trouvé"
      });
    }

    // Préparer le lot de notifications avec le type 'admin' qui est valide dans le schéma
    const notifications = users.map(user => ({
      recipient: user._id,
      content: content.trim(),
      type: "admin", // Utilisation du type 'admin' qui est valide dans le schéma
      isRead: false
    }));

    // Insérer toutes les notifications en une seule opération
    const createdNotifications = await Notification.insertMany(notifications);

    // Mettre à jour les utilisateurs en une seule opération
    const userUpdates = users.map(user => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $push: {
            notifications: {
              $each: createdNotifications
                .filter(notif => notif.recipient.toString() === user._id.toString())
                .map(notif => notif._id)
            }
          }
        }
      }
    }));

    await User.bulkWrite(userUpdates);

    // Émettre les notifications en temps réel via Socket.IO
    if (io) {
      createdNotifications.forEach(notification => {
        emitNotification(io, notification.recipient, notification);
      });
    }

    // Retourner les statistiques
    res.status(200).json({
      success: true,
      message: "Notifications diffusées avec succès",
      stats: {
        totalUsers: users.length,
        notificationsSent: createdNotifications.length,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la diffusion des notifications:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la diffusion des notifications",
      error: error.message
    });
  }
};
//delete
module.exports.deleteDistributedNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    const users = await User.find({});

    for (const user of users) {
      if (user.notifications && user.notifications.length > 0) {
        user.notifications = []; // Réinitialiser
        await user.save(); // Sauvegarder les modifications
      }
    }

    res
      .status(200)
      .json({ message: "Notifications et référencessupprimées avec succèss." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.deleteAllUserNotifications = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const io = req.app.get('io');

    await Notification.deleteMany({ recipient: userId });
    await User.findByIdAndUpdate(userId, { $set: { notifications: [] } });

    // Émettre la suppression en temps réel
    io.to(userId.toString()).emit('notificationsDeleted', { userId: userId.toString() });

    res.status(200).json({ message: "Toutes les notifications ont été supprimées" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get user notifications
module.exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    
    const notifications = await Notification
      .find({ recipient: userId })
      .populate("relatedCar", "marque model")
      .populate("relatedUser", "username")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// marqué un commentaire comme lu
module.exports.markAsRead = async (req, res) => {
  try {
    // Récupérer l'ID depuis l'URL ou le body
    const notificationId = req.query.notificationId || req.body.notificationId;
    console.log("notificationId:", notificationId);
    
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "ID de notification non fourni"
      });
    }

    const userId = req.session.user?._id;
    
    // Récupérer io correctement
    const io = req.app.get('io');
    
    // Vérifier que io existe avant de l'utiliser
    if (!io) {
      console.error("Socket.IO n'est pas disponible dans cette requête");
      // Continuer sans émettre d'événement WebSocket
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification non trouvée"
      });
    }

    // Émettre la mise à jour en temps réel SEULEMENT si io existe
    if (io && io.to) {
      io.to(userId.toString()).emit('notificationUpdated', {
        notificationId: notificationId.toString(),
        isRead: true
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
