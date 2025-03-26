var express = require('express');
var router = express.Router(); 
const newsLetter=require('../controllers/newsLetterController');


router.post('/addNewsLetter',newsLetter.addNewsLetter);
module.exports = router;