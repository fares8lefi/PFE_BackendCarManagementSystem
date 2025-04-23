var express = require('express');
var router = express.Router(); 
const contactController = require('../controllers/contactController');

router.post('/createMessage',contactController.createMessage); 
router.post('/getAllMessages',contactController.getAllMessages); 
router.put('/MarquerAsRead/:id',contactController.MarquerAsRead); 
module.exports = router;