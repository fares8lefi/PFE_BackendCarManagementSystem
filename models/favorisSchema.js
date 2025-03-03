const mongoose = require("mongoose");

const favorisSchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true, // Un utilisateur ne peut avoir qu'une seule entrée de favoris
      },
      cars: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Car",
          required: true,
        },
      ],
    },
    { timestamps: true } // Ajoute automatiquement `createdAt` et `updatedAt`
  );
const Favoris = mongoose.model("Favoris", favorisSchema);

module.exports = Favoris;
