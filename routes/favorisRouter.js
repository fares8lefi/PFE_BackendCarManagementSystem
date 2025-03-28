var express = require('express');
var router = express.Router(); 
const {requireAuthUser} = require('../middlewares/authMiddelwares');
const favorisController = require('../controllers/favorisController');


router.post('/addCarToFavorites',requireAuthUser,favorisController.addCarToFavorites); 
router.get('/getUserFavorites',requireAuthUser,favorisController.getUserFavorites); 
router.delete('/deleteFavoris',requireAuthUser,favorisController.deleteFavoris); 

module.exports = router;