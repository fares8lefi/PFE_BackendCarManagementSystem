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
    // Au lieu de findOne, vous pouvez populater les voitures complètes
    const favoris = await Favoris.findOne({ userId: req.session.user._id })
      .populate({
        path: "cars",
        model: Car,
        select: "marque model year price statut Boite Energie cars_images",
      })
      .lean(); // .lean() pour avoir un objet JS direct

    if (!favoris || !favoris.cars) {
      return res.status(200).json({ success: true, favorites: [] });
    }

    // Convertir les images en base64
    favoris.cars = favoris.cars.map((car) => {
      if (car.cars_images && car.cars_images.length > 0) {
        car.cars_images = car.cars_images.map(
          (imgBuffer) =>
            `data:image/jpeg;base64,${imgBuffer.toString("base64")}`
        );
      } else {
        car.cars_images = [];
      }
      return car;
    });

    // On renvoie directement le tableau complet
    res.status(200).json({
      success: true,
      favorites: favoris.cars,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete favoris
module.exports.deleteFavoris = async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (!userId) {
      return res.status(401).json({ message: "user non authentifié" });
    }

    const { carId } = req.body;

    if (!carId) {
      return res.status(400).json({ message: "ID du car manquant" });
    }
    // Suppression du favori
    const updatedFavoris = await Favoris.findOneAndUpdate(
      { userId },
      { $pull: { cars: carId } },
      { new: true }
    );

    if (!updatedFavoris) {
      return res
        .status(500)
        .json({ message: "Erreur lors de la mise à jour des favoris" });
    }

    return res.status(200).json({ favorites: updatedFavoris.cars });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
