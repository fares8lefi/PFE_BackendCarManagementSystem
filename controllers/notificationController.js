const Notification = require("../models/notificationSchema");
const User = require("../models/userSchema");

module.exports.createNotification = async (req, res) => {
  try {
    const { recipient, content } = req.body;

    const notification = new Notification({ recipient, content });
    const newNotification = await notification.save();

    // Émettre un événement Socket.IO pour informer les clients connectés de la nouvelle notification
    // io.emit('newNotification', newNotification);

    // Ajouter la notification à l'utilisateur correspondant
    await User.updateOne(
      { _id: recipient },
      { $push: { notifications: newNotification._id } }
    );
    console.log("notfictaions envoyé ");
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//duffisions
module.exports.broadcastNotifToAll = async (req, res) => {
  try {
    const { content } = req.body;
    const users = await User.find({}, "_id");

    if (users.length === 0) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé" });
    }

    //Envoier les notifications
    for (const user of users) {
      const newNotif = new Notification({
        recipient: user._id,
        content: content.trim(),
      });

      await newNotif.save(); // Sauvegarde de la notification
      await User.updateOne(
        { _id: user._id },
        { $push: { notifications: newNotif._id } }
      );
    }
    res
      .status(200)
      .json({ message: "Notifications envoyées à tous les utilisateurs." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// supprimer tous les notifications et initioalisation du réference
module.exports.deleteDistributedNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    const users = await User.find({});

    for (const user of users) {
      if (user.notifications && user.notifications.length > 0) {
        user.notifications = []; // Réinitialiser le tableau des notifications
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

    const deleteNotifications = await Notification.deleteMany({
      recipient: userId, // filtre par l'ID de l'utilisateur connecté
    });
    await User.findByIdAndUpdate(userId, { $set: { notifications: [] } }); //intialisation du réference
    res.status(200).json({ deleteNotifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get user notifications
module.exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const notifications = await Notification.find({ recipient: userId }).sort({
      createdAt: -1,
    }); // Trier par date de création

    res.status(200).json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
