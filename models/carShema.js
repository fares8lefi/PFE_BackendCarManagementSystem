const mongoose = require("mongoose");

const carShema = new mongoose.Schema({
  marque: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, required: true },
  price: { type: Number, require: true },
  description: { type: String },
  statut: {
    type: String,
    enum: ["Vendu", "Disponible"],
  },
  count :{type : Number ,default :'0'},
  // qrCodeId:{}, relation avec une autre tableau on va l'ajout
  // vendurId:{} , relation avec une autre tableau on va l'ajout
},
{timestamps : true}
);

carShema.pre("save",async function (next) {
    try{
        car.count = car.count + 1;
        next();
    }catch(error){
        next(error);
    }
    
    
});
carShema.post("save",async function (res ,req ,next) {
    console.log("car add -------------------------------");
})

const car = mongoose.model("carModel", carShema);
module.exports = car;
