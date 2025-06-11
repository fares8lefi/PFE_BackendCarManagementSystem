const multer = require("multer");
const path = require("path");
const fs = require("fs");


const uploadPath = "public/files";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Configuration de Multer pour stocker les fichiers en mémoire
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  console.log('Fichier reçu:', file.originalname, file.fieldname, file.mimetype);
  
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    console.log('Type de fichier rejeté:', file.mimetype);
    cb(new Error('Seules les images sont acceptées'), false);
  }
};

// Exporter l'instance de multer
const uploadfile = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limite de 5MB par fichier
  }
}).any(); // Utiliser .any() pour accepter tous les champs de fichiers

module.exports = uploadfile;
