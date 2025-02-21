const mongoose=require('mongoose');

const qrCodeSchema=new mongoose.Schema({
    qrCode : String ,
    carId: {type : mongoose.Schema.Types.ObjectId,ref:'Car',required :true , unique :true },//one to one} , 
});

const Qrcode = mongoose.model("Qrcode",qrCodeSchema)
module.exports =Qrcode;
