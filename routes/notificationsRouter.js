const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { requireAuthUser } = require("../middlewares/authMiddelwares");

// Routes protégées par l'authentification
router.post("/createNotification", requireAuthUser, notificationController.createNotification);
router.get("/getUserNotifications", requireAuthUser, notificationController.getUserNotifications);
router.put("/markAsRead", requireAuthUser, notificationController.markAsRead);
router.delete("/deleteAllUserNotifications", requireAuthUser, notificationController.deleteAllUserNotifications);
router.post("/broadcast", requireAuthUser, notificationController.broadcastNotifToAll);
router.delete("/all", requireAuthUser, notificationController.deleteDistributedNotifications);

module.exports = router;