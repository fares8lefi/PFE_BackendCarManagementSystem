const mongoose = require("mongoose");

const carShema = new mongoose.Schema(
  {
    marque: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    price: { type: Number, require: true },
    km :{type:Number , required :  true},
    phone :{type:Number , required :  true},
    Energie: {
      type: String,
      enum: ["Essence", "Diesel", "Hybrid", "Electric"]
    },
    Boite :{
      type: String,
      enum: ["Auto", "Manuelle"],
    },
    Position: {type: String},
    description: { type: String },
    Puissance: { type: Number },
    statut: {
      type: String,
      enum: ["Vendu","Disponible"],
      default: "Disponible"
    },
    cars_images: [{ type: Buffer }],

    count: { type: Number, default: "0" },
    // qrCodeId:{}, relation avec une autre tableau on va l'ajout
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    commentId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ], //one to many } ,       //relation avec une autre tableau user
  },
  { timestamps: true }
);

carShema.pre("save", async function (next) {
  try {
    this.count = this.count + 1;
    next();
  } catch (error) {
    next(error);
  }
});
carShema.post("save", async function (res, req, next) {
  console.log("car add -------------------------------");
});

const carModel = mongoose.model("carModel", carShema);
module.exports = carModel;
