var express = require('express');
var router = express.Router(); 
const qrCodeController = require('../controllers/qrCodeController');

router.get('/getCarQRCode/:carId', qrCodeController.getCarQRCode);

module.exports = router;
