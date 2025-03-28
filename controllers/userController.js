const { models } = require("mongoose");
const userModel = require("../models/userSchema");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const maxTime = 24 * 60 * 60; //24H

const createToken = (id) => {
  return jwt.sign({ id }, process.env.net_Secret, { expiresIn: maxTime });
};

module.exports.addUserClient = async (req, res) => {
  try {
    const { username, email, password } = req.body; // source de l'entré du data
    const role = "client";
    const user = await userModel.create({
      username: username,
      email: email,
      password: password,
      role: role,
    });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// add user client with image :

module.exports.addUserClientImg = async (req, res) => {
  try {
    const { username, email, password } = req.body; // source de l'entré du data
    const role = "client";
    const { fileName } = req.file;
    const user = await userModel.create({
      username: username,
      email: email,
      password: password,
      role: role,
      user_image: fileName,
    });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// add image tp base donné

module.exports.addUserClientImgOf = async (req, res) => {
  try {
    // Vérification du fichier
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image uploadée" });
    }

    // Vérification des données utilisateur
    if (!req.body.user) {
      return res
        .status(400)
        .json({ message: "Données utilisateur manquantes" });
    }

    // Parsing sécurisé
    let userData;
    try {
      userData = JSON.parse(req.body.user);
    } catch (error) {
      return res.status(400).json({ message: "Format JSON invalide" });
    }

    // Validation des champs
    const requiredFields = ["username", "email", "password"];
    const missingFields = requiredFields.filter((field) => !userData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Champs manquants : ${missingFields.join(", ")}`,
      });
    }

    // Conversion de l'image
    const imageBuffer = fs.readFileSync(req.file.path);

    // Création de l'utilisateur
    const user = await userModel.create({
      ...userData,
      role: "client",
      user_image: imageBuffer,
    });

    // Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    // Nettoyage en cas d'erreur
    if (req.file?.path) fs.unlinkSync(req.file.path);

    console.error("Erreur serveur :", error);
    res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Erreur interne du serveur",
    });
  }
};
// add admin
module.exports.addUserAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body; // source de l'entré du data
    const role = "admin";
    const user = await userModel.create({
      username: username,
      email: email,
      password: password,
      role: role,
    });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// find all users
module.exports.getAllUsers = async (req, res) => {
  try {
    const userlist = await userModel.find();
    res.status(200).json({ userlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// find users by id
module.exports.getUsersbyId = async (req, res) => {
  try {
    const id = req.session.user._id;
  const user = await userModel.findById(id);

    if (!user) {
      console.log("user non authentifié");
    }

    
    const userData = user.toObject(); // Convertir en objet JS
    if (user.user_image) {
      userData.user_image = `data:image/jpeg;base64,${user.user_image.toString("base64")}`;
    }

    res.status(200).json({ user: userData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete by id
module.exports.deleteuserById = async (req, res) => {
  try {
    const { id } = req.params;
    // check if user exist
    const checkUser = await userModel.findById(id);
    if (!checkUser) {
      throw new Error("User Not Found");
    }

    const user = await userModel.findByIdAndDelete(id);

    res.status(200).json("user was delete successfully");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// update client :

module.exports.UpdateUserClientbyId = async (req, res) => {
  try {
    const { username, email } = req.body; // source de l'entré du data
    const role = "client";
    const { id } = req.params;
    await userModel.findByIdAndUpdate(id, {
      $set: { username, email },
    });
    const update = await userModel.findById(id);
    res.status(200).json({ update });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// search

module.exports.serachByUsername = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      throw new Error("Username Not Found");
    }
    const userList = await userModel.find({
      username: { $regex: username, $options: "i" },
    });

    res.status(200).json({ userList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//login
module.exports.loginUser = async function (req, res) {
  try {
    const { email, password } = req.body;
    const user = await userModel.login(email, password);
    const token = createToken(user._id);

    res.cookie("jwt_login", token, {
      httpOnly: true,
      maxAge: maxTime * 1000,

    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      token, // Envoyer le token dans la réponse
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
//log out function
module.exports.logout = async (req, res) => {
  try {
    res.cookie("jwt_login", "", { httpOnly: false, maxAge: 1 });
    res.status(200).json("logged");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// serach and tri

/*
 module.exports.serachByUsername = async (req, res) => {
  try {
    const {username} = req.query ;
  
    const userList = await userModel.find().sort(paramétre :1).limit(nombre aaffiché); 1 as / -1 déc

    res.status(200).json({userList});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
*/

/*
 module.exports.serachButWeen = async (req, res) => {
  try {
    const max = req.query.max ;
    const min = req.query.min ;
  
    const userList = await userModel.find({age {$gt : min ,$lt : max}}).

    res.status(200).json({userList});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
*/
