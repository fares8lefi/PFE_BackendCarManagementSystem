var express = require('express');
var router = express.Router(); 
const notification = require('../controllers/notificationController');

router.post("/createNotification", notification.createNotification);
router.post("/broadcastNotifToAll", notification.broadcastNotifToAll);


module.exports = router;