'use strict'

var mongoose = require('mongoose');
var app = require('./app');

//Leer localhost de variables y puerto
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;


//Importar variables de entorno
require('dotenv').config({ path: 'variables.env' });


//Conexion a la DB
mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('La conexion a la bd se ha realizado correctamente.');

        //Crear servidor
        app.listen(port, host, () => {
            console.log('Servidor corriendo en ' + host + ':' + port);
        });

    }).catch(err => {
        console.log(err);
    });