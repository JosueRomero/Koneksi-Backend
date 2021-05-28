'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'gejosa';

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(403).send({message: 'La petición no tiene la cabecera de autenticación'});
    }
    //Quita comillas, en caso de que el token las tenga
    var token = req.headers.authorization.replace(/['"]+/g,'');

    try{
        var payload = jwt.decode(token, secret);
        if(payload.exp <= moment().unix()){
            return res.status(401).send({message: 'El token ha expirado'});
        }
    }catch(ex){
        return res.status(404).send({message: 'El token no es valido'});
    }

    //Se guaran los datos del usuario que inició sesión
    req.user = payload;
    next();
};