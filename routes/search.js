'use strict'


//EN USO
var express = require('express');
var searchController = require('../controllers/search');
var api = express.Router();
var md_auth = require('../middlewares/authenticate');

api.get('/home-s', searchController.home);
api.post('/search-products/:page?', searchController.searchProducts);
api.post('/search-jobs/:page?', searchController.searchJobs);
api.post('/search-services/:page?', searchController.searchService);


module.exports = api;