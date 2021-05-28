'use strict'

var express = require('express');
var bodyParser = require('body-parser');

var app = express();

//Cargar rutas
var user_routes = require('./routes/user');
var user_products_routes = require('./routes/userProducts');
var message_routes = require('./routes/message');
var interaction_rotues = require('./routes/interaction');
var favorite_routes = require('./routes/favorites');
var user_jobs_routes = require('./routes/userJobs');
var search_routes = require('./routes/search');
var user_services_routes = require('./routes/userServices');
var search_routes = require('./routes/search');
var search_routes = require('./routes/search');


//Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');

    next();
});

//Rutas
app.use('/api', user_routes);
app.use('/api', user_products_routes);
app.use('/api', message_routes);
app.use('/api', interaction_rotues);
app.use('/api', favorite_routes)
app.use('/api', user_jobs_routes);
app.use('/api', search_routes);
app.use('/api', user_services_routes) 
app.use('/api', search_routes);


//Exportar
module.exports = app;