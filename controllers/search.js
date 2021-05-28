'use strict'

var UserJobs = require('../models/UserJob');
var Jobs = require("../models/Jobs");
var UserProducts = require('../models/UserProducts');
var UserServices = require('../models/UserServices');
var UserJobs = require('../models/UserJob');
const User = require('../models/User');
var geoip = require('geoip-lite')


//-------PRUEBAS--------
function home(req, res) {
    res.status(200).send({ message: 'Hola mundo' });
}

function pruebas(req, res) {
    res.status(200).send({ message: 'Accion de pruebas en el servidor de nodejs' });
}


/* 
    RUTA POR GET: /search-jobs/:page?
*/
//Método que retorna los oficios que coincidan con la busqueda
async function searchJobs(req, res) {
    var params = req.body;
    var itemSearch = params.item.toLowerCase();
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 5;
    var userJobsArray = new Array();
    var skip = (page - 1) * itemsPerPage;


    var job = await Jobs.find({ name: { '$regex': itemSearch } }).exec().then(job => {

        return job
    }).catch(err => {
        return res.status(500).send({ message: "error buscando el oficio" });
    });
    if (job == undefined || job == "" || job == null) {
        job[0] = 0;
    }

    UserJobs.aggregate([{ $match: { $or: [{ jobs: job[0]._id }, { tags: { '$regex': itemSearch } }] } }, { $group: { _id: '$user' } }, { $skip: skip }, { $limit: itemsPerPage }]).exec().then(async function (results) {
        //retorna usuarios y sus productos
        for (let i = 0; i < results.length; i++) {
            await getUserJobs(results[i], itemSearch).then((value) => {
                //if ((country != '' || state != '' || city != '') && (value.user.country == country || value.user.state == state || value.user.city == city)) {
                userJobsArray[i] = value;
                //}
            });
        }

        //Total de paginas
        var total = await UserJobs.aggregate([{ $match: { $or: [{ name: { '$regex': itemSearch } }, { tags: { '$regex': itemSearch } }] } }, { $group: { _id: '$user' } }, { $count: 'total' }]);
        if (total.length == 0) {
            total = 0;
        } else {
            total = total[0].total;
        }

        var totalPages = Math.ceil(total / itemsPerPage);
        //console.log(total);
        return res.status(200).send({
            userJobsArray,
            total: totalPages
        });
    }).catch(err => {
        console.log(err);
        if (err) {
            return res.status(500).send({ message: 'Error en la petición 1' });
        }
    });
}

//Metodo auxiliar que obtiene el usuario y sus oficios
async function getUserJobs(id) {
    var usuario = await User.find({ _id: id }, { password: 0 }).exec().then((result) => {
        return result[0];

    }).catch((err) => {
        return handleError(err);
    });


    var trabajos = await UserJobs.find({ user: id }).populate('jobs').limit(4).exec().then((result) => {
        return result;
    }).catch((err) => {
        return handleError(err);
    });

    return {
        'user': usuario,
        'trabajos': trabajos
    };

}

//--------------------------------------------------------------------------------------------------------------
/* 
    METODO POR POST: /search-products/:page?
*/
//Metodo que obtiene los usuarios que venden productos según la busqueda
function searchProducts(req, res) {
    var params = req.body;

    var country;
    var state;
    var city;
    if (params.country || params.state || params.city) {
        country = params.country;
        state = params.state;
        city = params.city;
    } else if (req.user) {

        country = req.user.country;
        state = req.user.state;
        city = req.user.city;
    } else {
        country = '';
        state = '';
        city = '';
    }

    var itemSearch = params.item.toLowerCase();
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 5;
    var userProductsArray = new Array();
    var skip = (page - 1) * itemsPerPage;

    UserProducts.aggregate([{ $match: { $or: [{ name: { '$regex': itemSearch } }, { tags: { '$regex': itemSearch } }] } }, { $group: { _id: '$user' } }, { $skip: skip }, { $limit: itemsPerPage }]).exec().then(async function (results) {
        //retorna usuarios y sus productos
        for (let i = 0; i < results.length; i++) {
            await getUserProducts(results[i], itemSearch).then((value) => {
                userProductsArray[i] = value;

            });

        }
        //Total de paginas
        var total = await UserProducts.aggregate([{ $match: { $or: [{ name: { '$regex': itemSearch } }, { tags: { '$regex': itemSearch } }] } }, { $group: { _id: '$user' } }, { $count: 'total' }]);
        if (total.length == 0) {
            total = 0;
        } else {
            total = total[0].total;
        }

        var totalPages = Math.ceil(total / itemsPerPage);
        return res.status(200).send({
            userProductsArray,
            total: totalPages
        });
    }).catch(err => {
        console.log(err);
        if (err) {
            return res.status(500).send({ message: 'Error en la petición 1' });
        }
    });
}


//Método cuxiliar que retorna el usuario y sus productos
async function getUserProducts(id, itemSearch) {
    var usuario = await User.find({ _id: id }, { password: 0 }).exec().then((result) => {
        return result[0];

    }).catch((err) => {
        return handleError(err);
    });


    var productos = await UserProducts.find({ $and: [{ user: id }, { $or: [{ name: { '$regex': itemSearch } }, { tags: { '$regex': itemSearch } }] }] }).limit(3).exec().then((result) => {
        return result;
    }).catch((err) => {
        console.log(err);
        return handleError(err);
    });

    return {
        'user': usuario,
        'productos': productos
    };


}


//--------------------------------------------------------------------------------------------------------------
/* 
    RUTA POR POST: /search-services/:page?
*/
//Método que retorna los servicios que coincidan con la busqueda
function searchService(req, res) {
    var params = req.body;

    var itemSearch = params.item.toLowerCase();
    var page = 1;
    if (req.params.page) {
        page = req.params.page;
    }
    var itemsPerPage = 5;

    UserServices.find({ $or: [{ name: { '$regex': itemSearch } }, { tags: { '$regex': itemSearch } }] }).populate('user', 'name surname image').paginate(page, itemsPerPage, (err, services, total) => {

        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (!services) return res.status(500).send({ message: 'No hay resultados que mostrar' });

        return res.status(200).send({
            userServiceArray: services,
            total,
            pages: Math.ceil(total / itemsPerPage)
        });

    });

}


module.exports = {
    home,
    searchProducts,
    searchJobs,
    searchService
}