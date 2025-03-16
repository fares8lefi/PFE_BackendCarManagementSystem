const car = require("../models/carShema");
const carModel =require("../models/carShema");
const userModel = require("../models/userSchema");
const mongoose = require('mongoose');
const Qrcode =require('../models/qrCodeSchema');
const fs = require('fs');
const QRCode = require('qrcode');
const path = require('path');




  // add  cars with list of images 
  module.exports.addCarImages = async (req, res) => {
    try {
    
      const { marque, model, year, price, description ,userId } = req.body;
      const statut = "Disponible";
     
      const imageBuffers = req.files.map(file => fs.readFileSync(file.path));
      if (!userId) {
        throw new Error("L'ID de l'utilisateur est manquant.");
      }
      const car = await carModel.create({
        marque,
        model,
        year,
        price,
        description,
        statut,
        cars_images: imageBuffers, // liste des images 
        userID : userId ,

        // Stocker les images sous forme de Buffer
      });
  /*
      const carData = {
        marque: car.marque,
        model: car.model,
        year: car.year,

        price: car.price,
        description: car.description,
        statut: car.statut
    };

    // Convertir les données en JSON
    const carDataJSON = JSON.stringify(carData);

    // Générer le QR code avec les données de la voiture
     //const qrCodePath = path.join(__dirname, '../qrcodes', `vehicle_${car._id}.png`);
    // await QRCode.toFile(qrCodePath, carDataJSON);

    const qrCodeBuffer = await QRCode.toBuffer(carDataJSON)
    // Enregistrer le QR code dans la base de données
    const qrCodeData = await Qrcode.create({
       qrCode: carDataJSON, // Stocker les données JSON dans le champ qrCode
        carId: car._id, // Référence à la voiture
    });

      /*
      const url = `http://localhost:3000/vehicle/${car._id}`;
      const qrCodePath = `qrcodes/vehicle_${car._id}.png`;
      await QRCode.toFile(qrCodePath, url); 

      const qrCode = await qrcode.create({
        qrCode: url,
        carId: car._id, 
    });
    */

      if (!car || !car._id) {
        throw new Error("La voiture n'a pas été créée correctement.");
      }
      await userModel.findByIdAndUpdate(userId, {
        $addToSet: {carId :car._id},
      },{ upsert: true }
    );
      // Supprimer les fichiers temporaires après les avoir stockés dans MongoDB
      req.files.forEach(file => fs.unlinkSync(file.path));
  
      res.status(200).json({ car });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
 
  // get all cars 
  module.exports.getAllCars = async function(req, res) {
    try {
        const cars = await carModel.find();

        // Convertir les images Buffer en Base64
        const carsWithImages = cars.map(car => ({
            ...car._doc,
            cars_images: car.cars_images.length > 0 
                ? `data:image/jpeg;base64,${car.cars_images[0].toString('base64')}` 
                : null // Afficher seulement la première image
        }));

        res.status(200).json({ cars: carsWithImages });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



module.exports.getCarById = async function(req, res) {
  try {
      const { id } = req.params;
      const car = await carModel.findById(id);

      if (!car) {
          return res.status(404).json({ message: "Voiture non trouvée" });
      }

      // Convertir les images Buffer en Base64
      const carWithImages = {
          ...car._doc,
          cars_images: car.cars_images.length > 0 
              ? car.cars_images.map(img => `data:image/jpeg;base64,${img.toString('base64')}`)
              : []
      };

      res.status(200).json(carWithImages);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

// modification d'une car 
module.exports.UpdateCarById= async function(req ,res) {
  try{
    const {marque,model,year,price,description } = req.body;
    const {id}=req.params ;
     await carModel.findByIdAndUpdate(id ,{ 
      $set: {marque, model ,year,price, description},
    });
    const update = await carModel.findById(id);
    res.status(200).json({ update });
  }
  catch(error){
    res.status(500).json({message : error.message});
  }
  
}
// delete by id 

module.exports.deleteCarByID = async function (req, res) {
  try {
      const carId = req.params.carId;
      const car = await carModel.findById(carId);
      
      if (!car) {
          return res.status(404).json({ message: "Voiture non trouvée" });
      }
      //user id pour la mise a jour
      const userId = car.userID; 
      console.log("userId " ,userId);
      if (!userId) {
          return res.status(400).json({ message: "Vendeur non associé à cette voiture" });
      }

      //Suppression du car
      await carModel.findByIdAndDelete(carId);

      //update user 
      await userModel.findByIdAndUpdate(userId, {
          $pull: { carId: carId } //supprission du tableau des ids 
      });

      res.status(200).json({ message: "Voiture supprimée avec succès" });

  } catch (error) {
      console.error("Erreur :", error);
      res.status(500).json({ message: "Erreur serveur" });
  }
};
 

// suppression  sans relation  


// search

module.exports.getAllCarsByMarque =async (req,res)=>{
try{
  const {marque} = req.query ;
  if(!marque){
    throw new Error("Marque Not Found");
  }
  const carList = await carModel.find(
    {marque: {$regex : marque ,$options :"i"} }
  ) ;
  res.status(200).json({carList});
}
catch(error){
res.status(500).json({message : error.message});
}
}

// search and filltring 

module.exports.getAllCarsByPriceDes =async (req,res)=>{
  try{
    const {price} = req.query ;
    
    const marqueList = await carModel.find().sort({price: -1})

    res.status(200).json({marqueList});
  }
  catch(error){
  res.status(500).json({message : error.message});
  }
  } 

  //search and filtring  by price 
  module.exports.getAllCarsByMarqueFiltringByPrice =async (req,res)=>{
    try{
      const {marque} = req.query ;
      if(!marque){
        throw new Error("Marque Not Found");
      }
      const carList = await carModel.find(
        {marque: {$regex : marque ,$options :"i"} }
      ).sort({price: -1}) ;
      res.status(200).json({carList});
    }
    catch(error){
    res.status(500).json({message : error.message});
    }
    }
    //search and filtring  by  

    module.exports.getAllCarsByMarqueFiltringByYear =async (req,res)=>{
      try{
        const {marque} = req.query ;
        if(!marque){
          throw new Error("Marque Not Found");
        }
        const carList = await carModel.find(
          {marque: {$regex : marque ,$options :"i"} }
        ).sort({year: -1}) ;
        res.status(200).json({carList});
      }
      catch(error){
      res.status(500).json({message : error.message});
      }
      } 
      // search and filtring between 
         
      module.exports.getAllCarsByMarqueFiltringBetween =async (req,res)=>{
        try{
          const {marque} = req.query ;
          if(!marque){
            throw new Error("Marque Not Found");
          }
          const carList = await carModel.find({
            marque: { $regex: marque, $options: "i" }, // Filtre par marque (insensible à la casse)
            price: { $gte: 40, $lte: 250 } // Filtre par prix (entre 40 et 250)
        }).sort({ price: 1 });   
          // // il faut ajouté les entrée des valeurs dans une formulaire 
          res.status(200).json({carList});
        }
        catch(error){
        res.status(500).json({message : error.message});
        }
        } 