const car = require("../models/carShema");
const carModel = require("../models/carShema");
const userModel = require("../models/userSchema");
const mongoose = require("mongoose");
const Qrcode = require("../models/qrCodeSchema");
const fs = require("fs");
const QRCode = require("qrcode");
const path = require("path");

// add  cars with list of images
module.exports.addCar = async (req, res) => {
  try {
    const {
      marque,
      model,
      year,
      price,
      description,
      Position,
      Puissance,
      Boite,
      km,
      Energie,
      phone
    } = req.body;
    const userId = req.session.user && req.session.user._id;

    if (!userId) {
      throw new Error("ID utulisateur est manquant.");
    }

    // Lire les fichiers et récupérer en format Buffer
    const imageBuffers = req.files.map((file) => fs.readFileSync(file.path));

    const car = await carModel.create({
      marque,
      model,
      year,
      price,
      description,
      Position,
      Puissance,
      Boite,
      km,
      Energie,
      phone,
      cars_images: imageBuffers,
      userID: userId,
    });

    await userModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: { carId: car._id },
      },
      { upsert: true }
    );

    // Supprimer les fichiers temporaires après lecture
    req.files.forEach((file) => fs.unlinkSync(file.path));

    const annonceUrl = `http://localhost:3000/annonce/${car._id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(annonceUrl);

    
    const qrCode = await Qrcode.create({
      qrCode: qrCodeDataUrl,
      carId: car._id
    });

    res.status(200).json({ 
      car, 
      qrCode: qrCodeDataUrl,
      qrCodeId: qrCode._id 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all cars
module.exports.getAllCars = async function (req, res) {
  try {
    // Populate sur userID, uniquement le champ "username"
    const cars = await carModel.find()
      .populate('userID', 'username');

    
    const carsWithImages = cars.map((car) => ({
      ...car._doc,
      username: car.userID ? car.userID.username : null,
      cars_images:
        car.cars_images && car.cars_images.length > 0
          ? `data:image/jpeg;base64,${car.cars_images[0].toString('base64')}`
          : null,
    }));

    res.status(200).json({ cars: carsWithImages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getCarById = async function (req, res) {
  try {
    const { id } = req.params;
    const car = await carModel.findById(id);

    if (!car) {
      consolelog(" car non trouvée");
    }

    // Convertir les images Buffer en Base64
    const carWithImages = {
      ...car._doc,
      cars_images:
        car.cars_images.length > 0
          ? car.cars_images.map(
              (img) => `data:image/jpeg;base64,${img.toString("base64")}`
            )
          : [],
    };

    res.status(200).json(carWithImages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// modification d'une car
module.exports.UpdateCarById = async function (req, res) {
  try {
    const { carId } = req.params;
    const updates = req.body;

    if (!carId) {
      return res.status(400).json({ message: "id car invalide" });
    }

    const updatedCar = await carModel.findByIdAndUpdate(
      carId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedCar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// delete by id

module.exports.deleteCarByID = async function (req, res) {
  try {
    const { carId } = req.body;
    const car = await carModel.findById(carId);
    const userId = car.userID;
    //console.log("userId ", userId);
    if (!car) {
      console.log("car non found");
    }
    
    //Suppression du car
    await carModel.findByIdAndDelete(carId);

    //update user
    await userModel.findByIdAndUpdate(userId, {
      $pull: { carId: carId }, //supprission du tableau des ids
    });

    res.status(200).json({ message: "Voiture supprimée avec succès" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};




//search and filtring  by price

//search and filtring  by

;
// search and filtring between


//get user cars

module.exports.getUserCars = async (req, res) => {
  try {
    const userId = req.session.user._id;

    if (!userId) {
      console.log("user non trouvé");
    }

    const userCars = await carModel.find({ userID: userId });

    // Convertir le buffer
    const cars = userCars.map((car) => ({
      ...car._doc,
      cars_images:
        car.cars_images.length > 0
          ? `data:image/png;base64,${car.cars_images[0].toString("base64")}`
          : null,
    }));

    res.status(200).json({ cars: cars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getCarsFiltered = async (req, res) => {
  try {
    const {
      marque,
      maxPrice,
      minYear,
      maxYear,
      maxKm,         
      Energie,
      Boite,
    } = req.query;

    console.log("Les filtres sont :", marque, maxPrice, minYear, maxYear, maxKm, Energie, Boite);

    if (
      !marque ||
      !maxPrice ||
      !minYear ||
      !maxYear ||
      !maxKm ||
      !Energie ||
      !Boite
    ) {
      return res.status(400).json({
        success: false,
        message: "Tous les filtres doivent être appliqués.",
      });
    }

    const filter = {
      marque: { $regex: marque, $options: "i" },
      price: { $lte: Number(maxPrice) },
      year: { $gte: Number(minYear), $lte: Number(maxYear) },
      km: { $lte: Number(maxKm) },
      Energie,
      Boite,
    };

    console.log("Filtre MongoDB:", JSON.stringify(filter, null, 2));

    const cars = await carModel
      .find(filter)
      .populate("userID", "username email phone ")
      .populate("commentId")
      .sort({ price: -1, year: -1 })
      .lean();

    // Si aucun résultat n'est trouvé, retourner un tableau vide au lieu d'une erreur 404
    if (cars.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        cars: [],
        message: "Aucun véhicule ne correspond à vos critères de recherche."
      });
    }

    const carsWithImages = cars.map((car) => ({
      ...car,
      statut: car.statut,
      cars_images: car.cars_images.map((img) => ({
        data: img.toString("base64"),
        contentType: "image/png",
      })),
    }));

    res.status(200).json({
      success: true,
      count: carsWithImages.length,
      cars: carsWithImages,
    });
  } catch (error) {
    console.error("Erreur dans getCarsFiltered:", error);
    res.status(500).json({ 
      success: false, 
      message: "Une erreur est survenue lors de la recherche des véhicules.",
      error: error.message 
    });
  }
};


module.exports.getCarsByMarque = async (req, res) => {
  try {
    const { marque } = req.query;

    const filter = {};
    if (marque) {
      filter.marque = { $regex: marque, $options: "i" };
    }

    const cars = await carModel
      .find(filter)
      .populate("userID", "username email phone")
      .populate("commentId")
      .sort({ price: -1, year: -1 })
      .lean();

    const carsWithImages = cars.map((car) => ({
      ...car,
      cars_images: car.cars_images.map((img) => ({
        data: img.toString("base64"),
        contentType: "image/png",
      })),
    }));

    res.status(200).json({
      success: true,
      cars: carsWithImages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports.getCarStats = async (req, res) => {
  try {
    const stats = await carModel.aggregate([
      {
        $facet: {
          // Nombre total de voitures
          totalCars: [{ $count: "count" }],
          // Répartition par énergie
          energyTypes: [{ $group: { _id: "$Energie", count: { $sum: 1 } } }],
          // Répartition par marque
          brands: [
            { $group: { _id: "$marque", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            
          ],
          // Prix moyen
          averagePrice: [{ $group: { _id: null, avg: { $avg: "$price" } } }],
          // Statistiques des vues (count)
          viewsStats: [
            { $group: { _id: null, totalViews: { $sum: "$count" } } },
          ],
        },
      },
    ]);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getLatestCars = async (req, res) => {
  try {
    const latestCars = await carModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userID", "username email")
      .select("-cars_images"); // Exclure les images pour la performance

    res.json(latestCars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getMonthlySalesStats = async (req, res) => {
  try {
    const monthlyStats = await carModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$price" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]);

    res.json(monthlyStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getPriceStatsByBrand = async (req, res) => {
  try {
    const priceStats = await carModel.aggregate([
      {
        $group: {
          _id: "$marque",
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          totalCars: { $sum: 1 },
        },
      },
      { $sort: { totalCars: -1 } },
      { $limit: 10 },
    ]);

    res.json(priceStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
module.exports.getDailyViewsStats = async (req, res) => {
  try {
    const viewsStats = await carModel.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          },
          totalViews: { $sum: "$count" },
        },
      },
      { $sort: { "_id.date": -1 } },
      { $limit: 7 },
    ]);

    res.json(viewsStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getDailyCarAdditions = async (req, res) => {
  try {
    const dailyStats = await carModel.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } }, // Tri croissant (du plus ancien au plus récent)
      { $limit: 30 }, // Derniers 30 jours par exemple
    ]);

    res.json(dailyStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.updateCarStatus = async (req, res) => {
  try {
    const { carId } = req.params;
    const userId = req.session.user?._id;

    // Vérifier si l'utilisateur est connecté
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Utilisateur non authentifié" 
      });
    }

    
    const car = await carModel.findById(carId);
    if (!car) {
      return res.status(404).json({ 
        success: false, 
        message: "Voiture non trouvée" 
      });
    }

    // Vérifier si l'utilisateur est le propriétaire
    if (car.userID.toString() !== userId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Vous n'êtes pas autorisé à modifier cette voiture" 
      });
    }

    
    const updatedCar = await carModel.findByIdAndUpdate(
      carId,
      { 
        $set: { 
          statut: "Vendu"
        } 
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Statut de la voiture mis à jour avec succès",
      car: updatedCar
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
