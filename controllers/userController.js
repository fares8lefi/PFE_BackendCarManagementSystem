const { models } = require("mongoose");
const userModel = require("../models/userSchema");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
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
    const status ="Actif"
    const { fileName } = req.file;
    const user = await userModel.create({
      username: username,
      email: email,
      password: password,
      role: role,
      status :status,
      user_image: fileName,
    });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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
      status:"Actif",
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
    const users = await userModel.find().select('-password');
    res.status(200).json(users); 
  } catch (error) {
    res.status(500).json({  error: error.message });
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

    const userData = user.toObject();
    if (user.user_image && user.user_image.data) {
      userData.user_image = `data:${
        user.user_image.contentType
      };base64,${user.user_image.data.toString("base64")}`;
    } else {
      userData.user_image = "/default-avatar.png";
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

exports.UpdateUserClientbyId = async (req, res) => {
  try {
    const userId = req.session.user._id;

    // Validation des données
    if (!req.body.username || !req.body.email) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const updateData = {
      username: req.body.username,
      email: req.body.email,
    };

    // Gestion de l'image
    if (req.file) {
      const fileBuffer = await fs.promises.readFile(req.file.path);
      updateData.user_image = {
        data: fileBuffer, // Buffer obtenu depuis le fichier
        contentType: req.file.mimetype,
      };
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
      .select("-password");

    // Conversion de l'image en base64 pour l'envoi vers le front-end
    const userResponse = updatedUser.toObject();
    if (updatedUser.user_image) {
      userResponse.user_image = `data:${
        updatedUser.user_image.contentType
      };base64,${updatedUser.user_image.data.toString("base64")}`;
    }

    res.status(200).json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// search

module.exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: "Le terme de recherche est requis" });
    }

    const users = await userModel.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ]
    }).select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur de recherche",
      error: error.message 
    });
  }
};
// controllers/userController.js
exports.updateUserStatus = async (req, res) => {
  try {
    console.log("ID:", req.params.id);
    console.log("Status reçu:", req.body.status);
    const { status } = req.body;
    const user = await userModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message});
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
        status :user.status,
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

module.exports.logoutUser = async function (req, res) {
  try {
    // Réinitialiser le cookie "jwt_login"
    res.cookie("jwt_login", "", {
      maxAge: 1,
      httpOnly: true,
    });

    res.status(200).json({
      message: "Déconnexion réussie",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId= req.session.user._id;
    console.log("user IDDDDDDDDDDD : ",userId);
    console.log("user curent password  : ",currentPassword);
    console.log("user new password : ",newPassword);
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.changePassword(currentPassword, newPassword);
    
    res.json({
      success: true,
      message: "Mot de passe mis à jour avec succès",
    });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};