var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController')

/* GET users listing. */
router.post('/addUserClient', userController.addUserClient);
router.post('/addUserAdmin', userController.addUserAdmin);
router.get('/findAllUsers', userController.findAllUsers);
router.get('/findUsersbyId/:id', userController.findUsersbyId); // /:id qui sera affiché 
router.get('/deleteuserById/:id', userController.deleteuserById); // :id qui sera supprimé 

module.exports = router;
 