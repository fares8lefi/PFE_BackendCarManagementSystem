var express = require('express');
var router = express.Router(); 
const notification = require('../controllers/notificationController');
const {requireAuthUser} = require('../middlewares/authMiddelwares');


router.post("/createNotification", notification.createNotification);
router.post("/broadcastNotifToAll", notification.broadcastNotifToAll);
router.delete("/deleteDistributedNotifications", notification.deleteDistributedNotifications);
router.delete("/deleteAllUserNotifications",requireAuthUser,notification.deleteAllUserNotifications);
router.get("/getUserNotifications",requireAuthUser,notification.getUserNotifications);


module.exports = router;