'user strict'

var express = require('express');
var FavoriteController = require('../controllers/favorites');
var api = express.Router();
var md_auth = require('../middlewares/authenticate');

api.get('/probando-md', md_auth.ensureAuth, FavoriteController.probando);
api.post('/saveFavorite', md_auth.ensureAuth, FavoriteController.saveFavorite);
api.post('/getFavorite', md_auth.ensureAuth, FavoriteController.getFavorite);
api.post('/removeFavorite', md_auth.ensureAuth, FavoriteController.removeFavorite);

module.exports = api;