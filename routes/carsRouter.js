var express = require('express');
var router = express.Router(); 
const carController = require('../controllers/carControllers');
const uploadfile = require('../middlewares/uploadList')
const {requireAuthUser} = require('../middlewares/authMiddelwares');

router.post('/addCarImages',requireAuthUser,uploadfile.array('images', 10), carController.addCar);
router.get('/getAllCars', carController.getAllCars);
router.get('/getCarById/:id', carController.getCarById);
router.put('/UpdateCarById/:carId',requireAuthUser,carController.UpdateCarById);
router.put('/updateCarStatus/:carId',requireAuthUser,carController.updateCarStatus);
router.delete('/deleteCarByID',requireAuthUser,carController.deleteCarByID);
router.get('/getUserCars',requireAuthUser,carController.getUserCars);
router.get('/getCarStats', requireAuthUser,carController.getCarStats);
router.get('/getLatestCars', requireAuthUser,carController.getLatestCars);
router.get('/getMonthlySalesStats', requireAuthUser,carController.getMonthlySalesStats);
router.get('/getPriceStatsByBrand', requireAuthUser,carController.getPriceStatsByBrand);
router.get('/getDailyViewsStats',requireAuthUser, carController.getDailyViewsStats);
router.get('/getDailyCarAdditions', requireAuthUser,carController.getDailyCarAdditions);
router.get('/getCarsByMarque',carController.getCarsByMarque);
router.get('/getCarsFiltered',carController.getCarsFiltered);

module.exports = router;