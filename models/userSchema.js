const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: String,
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "L'adresse e-mail doit être valide ex: exemple@domaine.com .",
      ],
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial.",
      ],
    },
    role: {
      type: String,
      enum: ["admin", "client"],
    },
    status: {
      type: String,
      enum: ["Active", "blocked"],
       default: 'Actif'
    },
    user_image: {
      data: { type: Buffer, required: false },
      contentType: { type: String, required: false }
    },
    
    count: { type: Number, default: "0" },
    carId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }], //one to many
    commentId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
  },

  { timestamps: true }
);

// hachage du mot de mot de pase avant d'enregistrer en base de donnée
userSchema.pre("save", async function (next) {
  try {
    const salt = await bcrypt.genSalt();
    const user = this;
    user.password = await bcrypt.hash(user.password, salt);
    user.count = user.count + 1;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.post("save", async function (res, req, next) {
  console.log("user add -------------------------------");
});

//login model
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });

  if (user) {
    const auth = await bcrypt.compare(password, user.password);

    if (auth) {
      return user;
    } else {
      throw new Error("password invalid");
    }
  } else {
    throw new Error("email not found");
  }
};

userSchema.methods.changePassword = async function (currentPassword, newPassword) {
  
  const isMatch = await bcrypt.compare(currentPassword, this.password);
  if (!isMatch) {
    throw new Error("mot de passe actuel incorrect");
  }

  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new Error("le mot de passe doit contenir une minuscule, une majuscule, un chiffre et un caractère spécial");
  }

  this.password = newPassword;
  await this.save();
  return this;
};
const User = mongoose.model("User", userSchema);
module.exports = User;
