const Favoris = require("../models/favorisSchema");
const Car = require("../models/carShema");

module.exports.addCarToFavorites = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { carId } = req.body;
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
    res.status(200).json({ favoris });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// get user favoris

module.exports.getUserFavorites = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est connecté via le middleware
    if (!req.session.user) {
      console.log("user non authentifié");
    }

    // Récupérer les favoris avec les détails des voitures
    const favoris = await Favoris.findOne({
      userId: req.session.user._id,
    }).populate({
      path: "cars",
      model: Car, // la table qui stock les donnés (le model mongoose)
      select: "marque model year price", // les colone de la tables qui sera affiché 
    });

    if (!favoris) {
      console.log(" aucune favoris trouvé");
    }

    res.status(200).json({ favoris });
  } catch (error) {
    res.status(500).json({ message: error.message,});
  }
};
