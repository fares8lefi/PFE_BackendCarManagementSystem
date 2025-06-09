var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middlewares/uploadFile');
const {requireAuthUser} = require('../middlewares/authMiddelwares');

/* GET users listing. */

//router.post('/addUserClientImg',upload.single("user_image") ,userController.addUserClientImg);
router.post('/loginUser',userController.loginUser); 
//router.post('/loginUser',requireAuthUser,userController.loginUser); 
router.post('/singUpUser', upload.single("user_image"), userController.singUpUser);
router.put('/UpdateUserClientbyId',requireAuthUser,upload.single("user_image"),userController.UpdateUserClientbyId);
router.post('/logout',requireAuthUser,userController.logout);
router.post('/googleLogin',userController.googleLogin);
router.post('/addUserAdmin', upload.single("user_image"),userController.addUserAdmin);
router.get('/getAllUsers', userController.getAllUsers);
router.get('/getUsersbyId', requireAuthUser,userController.getUsersbyId);
router.delete('/deleteUser', userController.deleteUser); // :id qui sera supprimé 
router.get('/searchUsers', userController.searchUsers);
router.put('/changePassword',requireAuthUser,userController.changePassword);
router.patch('/updateUserStatus/:id/status', userController.updateUserStatus);
router.delete('/deleteUser/:id', userController.deleteUser);
router.post('/forgotPassword', userController.forgotPassword);
router.post('/verifyResetCode', userController.verifyResetCode);
router.post('/resetPassword', userController.resetPassword);
router.post('/verifyAccount', userController.verifyAccount);
module.exports = router;
 

