var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController')

/* GET users listing. */
router.post('/addUserClient', userController.addUserClient);
router.post('/addUserAdmin', userController.addUserAdmin);
router.get('/findAllUsers', userController.findAllUsers);

module.exports = router;
