const { models } = require("mongoose");
const userModel = require("../models/userSchema");
const fs = require("fs");
const jwt = require("JsonWebToken");


const maxTime = 24 *60 * 60 //24H
const createToken = (id) => {
  const token = jwt.sign({ id }, 'jwt_login_user', { expiresIn: maxTime });
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
    const { username, email, password } = req.body; // Données du formulaire
    const role = "client";

    // Lire le fichier image et le convertir en Buffer
    const imageBuffer = fs.readFileSync(req.file.path);

    // Créer un nouvel utilisateur avec l'image
    const user = await userModel.create({
      username,
      email,
      password,
      role,
      user_image: imageBuffer, // Stocker l'image sous forme de Buffer
    });

    // Supprimer le fichier temporaire après l'avoir stocké dans la base de données
    fs.unlinkSync(req.file.path);

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    const { id } = req.params;
    const user = await userModel.findById(id);
    res.status(200).json({ user });
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
    console.log(token);
    res.cookie("jwt_login_user", token, {httpOnly:false,maxAge:maxTime * 1000});
    console.log("token and cookie create successflly");
    res.status(200).json({user})
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
