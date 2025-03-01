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

module.exports.broadcastNotifToAll = async (req, res) => {
  try {
    const { content } = req.body;

    // 3. Récupération des utilisateurs
    const users = await User.find({}, "_id");

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé",
      });
    }

    const cleanContent = content.trim();
    let successCount = 0;
    const errors = [];

    for (const user of users) {
      try {
        // Création de la notification
        const newNotif = new Notification({
          recipient: user._id,
          content: cleanContent,
        });

        await newNotif.save();

        await User.findByIdAndUpdate(user._id, {
          $push: { notifications: newNotif._id },
        });

        successCount++;
      } catch (err) {
        errors.push({
          userId: user._id.toString(),
          error: err.message,
        });
      }
    }

    const response = {
      success: true,
      sentCount: successCount,
      totalUsers: users.length,
      errorCount: errors.length,
      message: `Notifications envoyées à ${successCount}/${users.length} utilisateurs`,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Erreur serveur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: error.message,
    });
  }
};
