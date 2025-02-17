const multer = require("multer");
const path = require('path');
const fs = require('fs');

// Créer le dossier 'public/files' s'il n'existe pas
const uploadPath = 'public/files';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // Dossier où les fichiers seront sauvegardés
  },
  filename: function (req, file, cb) {
    const originalName = file.originalname;
    const fileExtension = path.extname(originalName);
    let fileName = originalName;

    // Vérifier si le fichier existe déjà
    let fileIndex = 1;
    while (fs.existsSync(path.join(uploadPath, fileName))) {
      const baseName = path.basename(originalName, fileExtension);
      fileName = `${baseName}_${fileIndex}${fileExtension}`;
      fileIndex++;
    }

    cb(null, fileName); // Renommer le fichier si nécessaire
  }
});

// Exporter l'instance de multer
const uploadfile = multer({ storage: storage });

module.exports = uploadfile;