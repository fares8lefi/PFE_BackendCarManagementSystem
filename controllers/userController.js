const userModel = require("../models/userSchema");

module.exports.addUserClient = async (req, res) => {  
  try {
    const { username, email, password } = req.body; // source de l'entré du data
    const role = 'client';
    const user = await userModel.create({
      username: username,
      email: email,
      password: password,
      role: role
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
    const role = 'admin';
    const user = await userModel.create({
      username: username,
      email: email,
      password: password,
      role: role
    });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// find all users
module.exports.findAllUsers = async (req, res) => {  
  try {
    const userlist=await  userModel.find();
    res.status(200).json({ userlist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};