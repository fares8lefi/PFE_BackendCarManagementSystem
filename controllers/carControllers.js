const car = require("../models/carShema");
const carModel =require("../models/carShema");
const fs = require('fs');

// l'ajout d'une car 
module.exports.addCar = async (req, res) => {
    try {
      const {marque,model,year,price,description } = req.body; // source de l'entré du data
      const statut = "Disponible";
      const car = await carModel.create({
        marque : marque ,
        model :model, 
        year : year,
        price :price ,
        description : description,
        statut : statut
      });
      res.status(200).json({ car });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // add  cars with list of images 
  module.exports.addCarImages = async (req, res) => {
    try {
      console.log(req.files); // Vérifiez les fichiers reçus
      const { marque, model, year, price, description } = req.body;
      const statut = "Disponible";
  
      // Lire les fichiers et les convertir en Buffer
      const imageBuffers = req.files.map(file => fs.readFileSync(file.path));
  
      // Créer une nouvelle voiture avec la liste des images en Buffer
      const car = await carModel.create({
        marque,
        model,
        year,
        price,
        description,
        statut,
        cars_images: imageBuffers, // Stocker les images sous forme de Buffer
      });
  
      // Supprimer les fichiers temporaires après les avoir stockés dans MongoDB
      req.files.forEach(file => fs.unlinkSync(file.path));
  
      res.status(200).json({ car });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
 
  // get all cars 
  module.exports.getAllCars= async function(req ,res) {
    try{
      const cars = await carModel.find();
      res.status(200).json({cars});
    }
    catch(error){
      res.status(500).json({message : error.message});
    }
    
  }
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
// delete by is

module.exports.deleteCarByID= async function(req ,res) {
  try{
    
    const {id}=req.params ;
     await carModel.findByIdAndDelete(id);
    const deleteCar = await carModel.findById(id);
    console.log("car delete ") ;
    res.status(200).json({ deleteCar });
  }
  catch(error){
    res.status(500).json({message : error.message});
  }
}
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

// search and filtring 

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