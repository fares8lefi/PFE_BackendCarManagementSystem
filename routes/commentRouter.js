var express = require("express");
var router = express.Router();
const commentController = require("../controllers/commentController");
const {requireAuthUser} = require('../middlewares/authMiddelwares');

router.post("/addComment",requireAuthUser,commentController.addComment);
router.delete("/deleteComment",requireAuthUser, commentController.deleteComment);
router.get("/getCommentsByCar/:carId",commentController.getCommentsByCar);

module.exports = router;
