'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'gejosa';

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        type: user.type,
        image: user.image,
        lat: user.lat,
        lon: user.lon,
        country: user.country,
        state: user.state,
        city: user.city,
        created_at: user.created_at,
        iat: moment().unix(),
        exp: moment().add(30, 'days').unix()
    };

    //Se encripta el payload
    return jwt.encode(payload, secret);
};