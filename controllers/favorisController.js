const Favoris = require('../models/favorisSchema');
const Car = require("../models/carShema");

module.exports.addCarToFavorites = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { carId } = req.body
    if (!carId) {
        return res.status(400).json({ message: "ID de la voiture requis." });
      } 
      const car = await Car.findById(carId);
      if (!car) {
       console.log("car non trouvé");
      } 
      const favoris = await Favoris.findOneAndUpdate(
        { userId },
        { $addToSet: { cars: carId } }, // Évite les doublons
        { new: true, upsert: true } // Crée le document s'il n'existe pas
      );
    res.status(200).json({favoris}) ;
  } catch (error) {
    res.status(500).json({message: error.message}) ;
  }
};

