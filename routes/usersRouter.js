var express = require('express');
var router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middlewares/uploadFile');
const {requireAuthUser} = require('../middlewares/authMiddelwares');

/* GET users listing. */

//router.post('/addUserClientImg',upload.single("user_image") ,userController.addUserClientImg);
//router.post('/loginUser',userController.loginUser); 
router.post('/loginUser',requireAuthUser,userController.loginUser); 
router.post('/addUserClientImgOf', upload.single("user_image"), userController.addUserClientImgOf);
router.put('/UpdateUserClientbyId/:id', userController.UpdateUserClientbyId);
router.post('/addUserAdmin', userController.addUserAdmin);
router.get('/getAllUsers', userController.getAllUsers);
router.get('/getUsersbyId/:id', userController.getUsersbyId); // /:id qui sera affiché 
router.delete('/deleteuserById/:id', userController.deleteuserById); // :id qui sera supprimé 
router.get('/serachByUsername', userController.serachByUsername);
module.exports = router;
 