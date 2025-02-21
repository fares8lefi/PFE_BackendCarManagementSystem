const mongoose = require('mongoose') ;

const commentShema= new mongoose.Schema({
    content : {type : String},
    carId: {type : mongoose.Schema.Types.ObjectId,ref:'Car',required :true , unique :true },
    userId: {type : mongoose.Schema.Types.ObjectId,ref:'user',required :true , unique :true },
    
},
{timestamps : true}
); 

const Comment = mongoose.model("Comment",commentShema)
module.exports =Comment;
