var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController')

/* GET users listing. */
router.post('/addUserClient', userController.addUserClient);
router.post('/addUserAdmin', userController.addUserAdmin);
router.get('/getAllUsers', userController.getAllUsers);
router.get('/getUsersbyId/:id', userController.getUsersbyId); // /:id qui sera affiché 
router.delete('/deleteuserById/:id', userController.deleteuserById); // :id qui sera supprimé 

module.exports = router;
 