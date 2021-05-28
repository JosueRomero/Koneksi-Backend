'use strict'
 
//EN USO
var express = require('express');
var UserController = require('../controllers/user');
var api = express.Router();
var md_auth = require('../middlewares/authenticate');

//RUTAS GET
api.get('/pruebas', UserController.pruebas);
api.get('/home', UserController.home);

//RUTAS PUT
api.put('/update-user/:id', md_auth.ensureAuth, UserController.updateUser);
api.put('/update-location/:id', md_auth.ensureAuth, UserController.updateLocation);

//RUTAS POST
api.post('/login', UserController.loginUser);
api.post('/saveUser', UserController.saveUser);
api.post('/updateCoverPage', UserController.updateCoverPage);
api.post('/updateAvatar', UserController.updateAvatar);


module.exports = api;