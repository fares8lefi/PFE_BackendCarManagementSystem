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
    user_image: { type: Buffer, required: false, default: "client.png" },
    count: { type: Number, default: "0" },
    carId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }], //one to many
    commentId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
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
const User = mongoose.model("User", userSchema);
module.exports = User;
