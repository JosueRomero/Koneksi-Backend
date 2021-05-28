'use strict'


//EN USO
var express = require('express');
var UserProductsController = require('../controllers/userProducts');
var api = express.Router();
var md_auth = require('../middlewares/authenticate');

//RUTAS GET
api.get('/pruebas-products', UserProductsController.pruebas);
api.get('/home', UserProductsController.home);

//RUTAS POST
api.post('/save-products', UserProductsController.saveProducts);
api.post('/save-product', md_auth.ensureAuth, UserProductsController.saveProduct);
api.post('/get-products/:id?/:page?', UserProductsController.getProducts);
//api.post('/get-products', UserProductsController.getProducts);

//RUTAS PUT
api.put('/update-product/:id', md_auth.ensureAuth, UserProductsController.updateProduct);

//RUTAS DELETE
api.delete('/deleteProduct/:id', md_auth.ensureAuth, UserProductsController.deleteProduct);

module.exports = api;