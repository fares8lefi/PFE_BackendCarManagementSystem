const { models } = require("mongoose");
const userModel = require("../models/userSchema");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const storage = multer.memoryStorage();
const { OAuth2Client } = require('google-auth-library');
const upload = multer({ storage });
const maxTime = 24 * 60 * 60; //24H
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const carModel = require("../models/carShema");
const Qrcode = require("../models/qrCodeSchema");
const Comment = require("../models/commentSchema");
const Notification = require("../models/notificationSchema");

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
    const status = "Actif";
    const { fileName } = req.file;
    const user = await userModel.create({
      username: username,
      email: email,
      password: password,
      role: role,
      status: status,
      user_image: fileName,
    });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.singUpUser = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image uploadée" });
    }

    if (!req.body.user) {
      return res.status(400).json({ message: "Données utilisateur manquantes" });
    }

    let userData;
    try {
      userData = JSON.parse(req.body.user);
    } catch (error) {
      return res.status(400).json({ message: "Format JSON invalide" });
    }

    const requiredFields = ["username", "email", "password"];
    const missingFields = requiredFields.filter((field) => !userData[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Champs manquants : ${missingFields.join(", ")}`,
      });
    }

    // Générer un code de validation (6 chiffres)
    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const validationCodeExpiry = Date.now() + 3600000; // Code valide pendant 1 heure

    const imageBuffer = fs.readFileSync(req.file.path);

    const user = await userModel.create({
      ...userData,
      role: "client",
      status: "Pending", // Statut initial en attente de validation
      user_image: imageBuffer,
      validationCode: validationCode,
      validationCodeExpiry: validationCodeExpiry,
      isVerified: false
    });

    // Nettoyage du fichier temporaire
    fs.unlinkSync(req.file.path);

    // Configurer le transporteur d'email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Configurer l'email de validation
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userData.email,
      subject: 'Validation de votre compte',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Bienvenue sur notre plateforme !</h2>
          <p>Bonjour ${userData.username},</p>
          <p>Merci de vous être inscrit. Pour activer votre compte, veuillez utiliser le code de validation suivant :</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${validationCode}</strong>
          </div>
          <p>Ce code est valable pendant 1 heure.</p>
          <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe de support</p>
        </div>
      `
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Compte créé avec succès. Veuillez vérifier votre email pour activer votre compte.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// add admin
module.exports.addUserAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Tous les champs sont obligatoires" });
    }
    let userImage;
    if (req.file) {
      userImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const admin = await userModel.create({
      username,
      email,
      password,
      user_image: userImage,
      role: "admin",
      status: "Active",
    });
    res.status(200).json({ admin });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// find all users
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      userData.user_image = `data:${user.user_image.contentType
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
module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    // Supprimer toutes les voitures de l'utilisateur
    const carsToDelete = await carModel.find({ userID: id });
    const carIds = carsToDelete.map(car => car._id);

    await Qrcode.deleteMany({ carId: { $in: carIds } });


    await Comment.deleteMany({ userId: id });


    await Comment.deleteMany({ carId: { $in: carIds } });


    await Notification.deleteMany({ userId: id });

    await carModel.deleteMany({ userID: id });


    await userModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Utilisateur et toutes ses données associées ont été supprimés avec succès",
      deletedData: {
        carsDeleted: carIds.length,
        commentsDeleted: await Comment.countDocuments({ userId: id }),
        notificationsDeleted: await Notification.countDocuments({ userId: id })
      }
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
      error: error.message
    });
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
      userResponse.user_image = `data:${updatedUser.user_image.contentType
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
      return res
        .status(400)
        .json({ message: "Le terme de recherche est requis" });
    }

    const users = await userModel
      .find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
        ],
      })
      .select("-password");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Erreur de recherche",
      error: error.message,
    });
  }
};
// controllers/userController.js
exports.updateUserStatus = async (req, res) => {
  try {
    console.log("ID:", req.params.id);
    console.log("Status reçu:", req.body.status);
    const { status } = req.body;
    const user = await userModel
      .findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      )
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("error : ", error);
    res.status(500).json({ error: error.message });
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
        status: user.status,
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
    const userId = req.session.user._id;
    console.log("user IDDDDDDDDDDD : ", userId);
    console.log("user curent password  : ", currentPassword);
    console.log("user new password : ", newPassword);
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
module.exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Vérifier si l'utilisateur existe déjà
    let user = await userModel.findOne({ email });

    if (!user) {
      // Créer un nouvel utilisateur avec le credential Google comme mot de passe
      user = await userModel.create({
        email,
        username: name,
        user_image: picture,
        password: credential,
        status: 'Active',
        role: 'client',
        isGoogleUser: true
      });
    } else if (!user.isGoogleUser) {
      // Si l'utilisateur existe mais n'est pas un utilisateur Google
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé avec un compte normal. Veuillez vous connecter avec votre mot de passe."
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.net_Secret,
      { expiresIn: '24h' }
    );

    // Envoyer la réponse
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        user_image: user.user_image,
        isGoogleUser: user.isGoogleUser
      }
    });

  } catch (error) {
    console.error('Erreur de connexion Google:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion avec Google'
    });
  }
};

// Fonction pour vérifier si l'email existe et envoyer le code de réinitialisation
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'email existe
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Aucun compte associé à cet email"
      });
    }

    // Générer un code de réinitialisation (6 chiffres)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = Date.now() + 3600000; // Code valide pendant 1 heure

    // Mettre à jour uniquement les champs de réinitialisation
    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: resetCode,
          resetPasswordExpires: resetCodeExpiry
        }
      }
    );

    // Configurer le transporteur d'email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Configurer l'email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Code de réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Réinitialisation de votre mot de passe</h2>
          <p>Bonjour,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de réinitialisation :</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
            <strong>${resetCode}</strong>
          </div>
          <p>Ce code est valable pendant 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
          <p>Cordialement,<br>L'équipe de support</p>
        </div>
      `
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Un code de réinitialisation a été envoyé à votre adresse email"
    });

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du code de réinitialisation"
    });
  }
};

// Fonction pour vérifier le code de réinitialisation
module.exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await userModel.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Code invalide ou expiré"
      });
    }

    res.status(200).json({
      success: true,
      message: "Code vérifié avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification du code"
    });
  }
};

// Fonction pour réinitialiser le mot de passe
module.exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    console.log("email : ", email);
    console.log("code : ", code);
    console.log("newPassword : ", newPassword);
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code et nouveau mot de passe sont requis"
      });
    }

    const user = await userModel.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Code invalide ou expiré"
      });
    }

    // Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe avec le hash
    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          resetPasswordToken: undefined,
          resetPasswordExpires: undefined
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Mot de passe réinitialisé avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réinitialisation du mot de passe"
    });
  }
};

// Fonction pour vérifier le code de validation
module.exports.verifyAccount = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await userModel.findOne({
      email,
      validationCode: code,
      validationCodeExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Code invalide ou expiré"
      });
    }

    // Mettre à jour le statut de l'utilisateur
    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          status: "Active",
          isVerified: true,
          validationCode: undefined,
          validationCodeExpiry: undefined
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Compte validé avec succès"
    });

  } catch (error) {
    console.error('Erreur lors de la validation du compte:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la validation du compte"
    });
  }
};