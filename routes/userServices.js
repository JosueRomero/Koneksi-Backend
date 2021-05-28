'use strict'
 
//EN USO
var express = require('express');
var UserServicesController = require('../controllers/userServices');
var api = express.Router();

//METODOS POR POST
api.post('/updateUserServices/:id', UserServicesController.updateUserServices);
api.post('/saveUserServices', UserServicesController.saveUserServices);

//METODOS POR GET
api.get('/get-user-services/:id?/:page?', UserServicesController.getUserservices);

//METODOS POR DELETE
api.delete('/deleteUserServices', UserServicesController.deleteUserServices);

//METODOS POR PUT
api.put('/update-images', UserServicesController.updateImages);
api.put('/delete-photo/:id', UserServicesController.deletePhoto);

module.exports = api; 