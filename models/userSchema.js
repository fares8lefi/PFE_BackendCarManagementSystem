const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

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
      validate: {
        validator: function(v) {
          if (this.isGoogleUser) {
            return true;
          }
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);
        },
        message: "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial."
      }
    },
    role: {
      type: String,
      enum: ["admin", "client"],
    },
    status: {
      type: String,
      enum: ["Active", "blocked"],
       default: 'Active'
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
    isGoogleUser: {
      type: Boolean,
      default: false
    }
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
        password: credential, // Utiliser le credential comme mot de passe
        status: 'Active',
        role: 'client',
        isGoogleUser: true // Ce flag désactive la validation du mot de passe
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

const User = mongoose.model("User", userSchema);
module.exports = User;
