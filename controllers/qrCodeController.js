const Qrcode = require("../models/qrCodeSchema");
const carModel = require("../models/carShema");

// Obtenir le QR code d'une voiture spécifique
module.exports.getCarQRCode = async (req, res) => {
  try {
    const { carId } = req.params;

    // Vérifier si la voiture existe
    const car = await carModel.findById(carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: "Voiture non trouvée"
      });
    }

    // Récupérer le QR code associé à la voiture
    const qrCode = await Qrcode.findOne({ carId });
    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: "QR code non trouvé pour cette voiture"
      });
    }

    res.status(200).json({
      success: true,
      qrCode: qrCode.qrCode,
      carId: qrCode.carId
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du QR code:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du QR code"
    });
  }
};

