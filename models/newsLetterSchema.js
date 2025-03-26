const mongoose = require("mongoose");

const newsLetterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
          "L'adresse e-mail doit être valide ex: exemple@domaine.com .",
        ],
      },
})
const newsLetter = mongoose.model("newsLetter", newsLetterSchema);
module.exports = newsLetter;
