'user strict'

var express = require('express');
var InteractionController = require('../controllers/interaction');
var api = express.Router();
var md_auth = require('../middlewares/authenticate');

api.get('/probando-md', md_auth.ensureAuth, InteractionController.probando);
api.post('/comment', md_auth.ensureAuth, InteractionController.saveComment);
api.post('/deleteComment', md_auth.ensureAuth, InteractionController.deleteComment);
api.post('/getComment/:page?', InteractionController.getComments);
api.post('/saveRating', md_auth.ensureAuth, InteractionController.saveRating);
api.post('/getRating/:userSaved', InteractionController.getRating);
api.post('/getDistance',InteractionController.getDistance);

module.exports = api;