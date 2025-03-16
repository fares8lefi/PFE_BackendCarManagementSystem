var express = require('express');
var router = express.Router(); 
const carController = require('../controllers/carControllers');
const uploadfile = require('../middlewares/uploadList')


router.post('/addCarImages', uploadfile.array('images', 10), carController.addCarImages);
router.get('/getAllCars', carController.getAllCars);
router.get('/getCarById/:id', carController.getCarById);
router.get('/getAllCarsByMarque', carController.getAllCarsByMarque);
router.get('/getAllCarsByMarqueFiltringByPrice', carController.getAllCarsByMarqueFiltringByPrice);
router.get('/getAllCarsByMarqueFiltringByYear', carController.getAllCarsByMarqueFiltringByYear);
router.get('/getAllCarsByMarqueFiltringBetween', carController.getAllCarsByMarqueFiltringBetween);
router.put('/UpdateCarById/:id', carController.UpdateCarById);
router.delete('/deleteCarByID/:carId', carController.deleteCarByID);


module.exports = router;