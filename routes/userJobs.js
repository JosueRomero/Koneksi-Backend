'use strict'


//EN USO
var express = require('express');
const userJobs = require('../controllers/userJobs');
var UserJobsController = require('../controllers/userJobs');
var api = express.Router();
var md_auth = require('../middlewares/authenticate');

//RUTAS GET
api.get('/pruebas-j', UserJobsController.pruebas);
api.get('/home-j', UserJobsController.home);


//RUTAS POST
api.post('/get-user-jobs/:id?/:page?', UserJobsController.getUserJobs);
api.post('/get-jobs', UserJobsController.getJobs);
api.post('/save-user-jobs', UserJobsController.saveUserJobs);
api.post('/save-user-job',md_auth.ensureAuth, UserJobsController.saveUserJob);

//RUTAS DELETE
api.delete('/delete-job/:id', md_auth.ensureAuth, UserJobsController.deleteUserJob);

//RUTAS PUT
api.put('/update-user-job/:id', md_auth.ensureAuth, UserJobsController.updateUserJob);

module.exports = api;