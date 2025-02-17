var express = require('express');
var router = express.Router(); 
const carController = require('../controllers/carControllers');
const uploadfile = require('../middlewares/uploadList')

router.post('/addCar', carController.addCar);
router.post('/addCarImages', uploadfile.array('images', 10), carController.addCarImages);
router.get('/getAllCars', carController.getAllCars);
router.get('/getAllCarsByMarque', carController.getAllCarsByMarque);
router.get('/getAllCarsByMarqueFiltringByPrice', carController.getAllCarsByMarqueFiltringByPrice);
router.get('/getAllCarsByMarqueFiltringByYear', carController.getAllCarsByMarqueFiltringByYear);
router.get('/getAllCarsByMarqueFiltringBetween', carController.getAllCarsByMarqueFiltringBetween);
router.put('/UpdateCarById/:id', carController.UpdateCarById);
router.delete('/deleteCarByID/:id', carController.deleteCarByID);


module.exports = router;