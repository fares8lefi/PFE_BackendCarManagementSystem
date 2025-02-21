var express = require('express');
var router = express.Router(); 
const commentController = require('../controllers/commentController') ;

router.post('/addComment', commentController.addComment);

module.exports = router;