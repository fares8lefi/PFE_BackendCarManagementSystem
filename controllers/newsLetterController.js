const newsLetterModel = require("../models/newsLetterSchema");

module.exports.addNewsLetter = async (req, res) => {
  try {
    const email = req.body.email;

    const newsLetter = await newsLetterModel.create({
      email,
    });
    res.status(200).json({ newsLetter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.getNewsLetter = async (req, res) => {
  try {
    const ListEmail = await newsLetterModel.find({});
    res.status(200).json({ ListEmail });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
