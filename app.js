var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');
const cors = require("cors");
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const io = require('socket.io');

// Routes
var usersRouter = require('./routes/usersRouter');
var carsRouter = require('./routes/carsRouter');
var commentRouter = require('./routes/commentRouter');
var notificationRouter = require('./routes/notificationsRouter');
var favorisRouter = require('./routes/favorisRouter');
var newsLetter = require('./routes/newsLetterRouter');
var contactRouter = require('./routes/contactRouter');
var qrCodeRouter = require('./routes/qrCodeRouter');
var app = express();

// Configuration Multer
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées !'), false);
    }
  }
});

// Middlewares
require('dotenv').config();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS config améliorée
app.use(cors({
  origin: " http://localhost:5173",
  methods: "GET,POST,PUT,DELETE ,PATCH",
  allowedHeaders: "Content-Type,Authorization ,Cache-Control",
  credentials: true
}));

// Session config (ajout de sameSite)
app.use(session({
  secret: process.env.net_Secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'Lax'
  }
}));

// Middleware pour rendre io accessible dans les routes
app.use((req, res, next) => {
  req.io = io(http.createServer(app), {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  next();
});

// Au lieu d'initialiser socket.io à chaque requête, fais-le une seule fois
const server = http.createServer(app);
const ioServer = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Rendre io disponible dans l'application
app.set('io', ioServer);

// Gestion des connexions Socket.IO
ioServer.on('connection', (socket) => {
  console.log('Un utilisateur connecté');

  socket.on('authenticate', (userId) => {
    socket.join(userId);
    console.log(`Utilisateur ${userId} authentifié`);
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur déconnecté');
  });
});

app.use('/users', usersRouter);
app.use('/cars', carsRouter);
app.use('/comment', commentRouter);
app.use('/notification', notificationRouter);
app.use('/favoris', favorisRouter);
app.use('/newsLetter', newsLetter);
app.use('/contact', contactRouter);
app.use('/qrCode', qrCodeRouter);
// Middleware d'upload pour les routes nécessitant des fichiers
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  
  console.error(`[${new Date().toISOString()}] Error: ${err.message}`);
  console.error(err.stack);

  
  res.status(err.status || 500).json({
    error: {
      message: req.app.get('env') === 'development' ? 
        err.message : 'Une erreur est survenue',
      ...(req.app.get('env') === 'development' && { stack: err.stack })
    }
  });
});

const { connectToDb } = require('./config/db');

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  connectToDb();
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;