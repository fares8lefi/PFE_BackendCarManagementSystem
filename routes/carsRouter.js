var express = require('express');
var router = express.Router(); 
const carController = require('../controllers/carControllers');


router.post('/addCar', carController.addCar);
router.get('/getAllCars', carController.getAllCars);
router.put('/UpdateCarById/:id', carController.UpdateCarById);
router.delete('/deleteCarByID/:id', carController.deleteCarByID);


module.exports = router;