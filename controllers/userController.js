const userModel = require("../models/userSchema");

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
      $set: {username, email},
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
    const {username} = req.query ;
    if(!username){
      throw new Error("Username Not Found");
    }
    const userList = await userModel.find(
      {username: {$regex : username ,$options :"i"} }
    ) ;

    res.status(200).json({userList});
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