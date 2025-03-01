var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require('express-session');

var usersRouter = require('./routes/usersRouter');
var carsRouter = require('./routes/carsRouter');
var commentRouter = require('./routes/commentRouter');
var notificationRouter = require('./routes/notificationsRouter');


var app = express();

// view engine setup
const http =require('http');
const {connectToDb}=require('./config/db');
require('dotenv').config()
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({   //config session
  secret: process.env.net_Secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: {secure: false},
    maxAge: 24*60*60,
  
  },  
}))
//
app.use('/users', usersRouter);
app.use('/cars',carsRouter);
app.use('/comment',commentRouter);
app.use('/notification',notificationRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const server=http.createServer(app); // création dun server
// connexion au server
server.listen(process.env.port,()=>{
  connectToDb();
  console.log("server running in port 5000");
})
module.exports = app;
