var express = require('express');
var router = express.Router(); 
const newsLetter=require('../controllers/newsLetterController');


router.post('/addNewsLetter',newsLetter.addNewsLetter);
router.get('/getNewsLetter',newsLetter.getNewsLetter);
module.exports = router;