'use strict'

var UserJobs = require('../models/UserJob');
const Transaction = require("mongoose-transactions");
const User = require('../models/User');
var Jobs = require('../models/Jobs');


//-------PRUEBAS--------
function home(req, res) {
    res.status(200).send({ message: 'Hola mundo' });
}

function pruebas(req, res) {
    res.status(200).send({ message: 'Accion de pruebas en el servidor de nodejs' });
}
//---------------------

/* 
x-www-form-urlencoded:
    *description
    *schedule
    *jobId -> id de la tabla de oficios
    *user -> id del usuario al que le pertenecen los oficios

    URL: /save-user-jobs
*/
function saveUserJobs(req, res) {
    //DATOS
    var params = req.body;
    var error = false;

    //console.log(params);


    var transaction = new Transaction();
    var userJobs = new UserJobs();
    //console.log(params);
    var transaction = new Transaction();
    var userJobs = new UserJobs();

    try {
        if (!Array.isArray(params)) {

            userJobs.description = params.description;
            //ID del usuario
            userJobs.user = params.user;
            userJobs.schedule = params.schedule;
            //ID de los oficios seleccionados
            userJobs.jobs = params.jobId;

            //Se representa como ["tag1,tag2", "tag1,tag2"] 
            userJobs.tags = params.tags.split(',');

            transaction.insert('UserJob', userJobs);

        } else {

            for (let i = 0; i < params.length; i++) {
                userJobs = new UserJobs();
                if (params[i].description && params[i].schedule && params[i].jobId && params[i].user) {

                    userJobs.description = params[i].description;
                    //ID del usuario
                    userJobs.user = params[i].user;
                    userJobs.schedule = params[i].schedule;
                    //ID de los oficios seleccionados
                    userJobs.jobs = params[i].jobId;

                    //Se representa como ["tag1,tag2", "tag1,tag2"] 
                    userJobs.tags = params[i].tags.split(',');

                    transaction.insert('UserJob', userJobs);
                } else {
                    error = true;
                }
            }
        }

        if (!error) {
            console.log(error);
            transaction.run();
            return res.status(200).send({ message: "Oficios agregados con éxito" });
        } else {
            console.log(error);
            transaction.rollback();
            transaction.clean();
            return res.status(200).send({ message: "Error al agregar los Oficios" });
        }

    } catch (error) {
        console.error(error);
        const rollbackObj = transaction.rollback().catch(console.error);
        transaction.clean();
        return res.status(200).send({ message: "Error al agregar los oficios" });
    }

}

/* 
    URL: /delete-job/:id -> id del oficio
*/
//Método que elimina un oficio del un usuario
function deleteUserJob(req, res) {

    var userJobId = req.params.id;
    var userLogin = req.user.sub;

    if (userLogin) {
        UserJobs.count({ user: userLogin, '_id': userJobId }).exec().then(response => {
            if (response > 1) {
                UserJobs.deleteOne({ 'user': userLogin, '_id': userJobId }, (err, result) => {
                    if (err) return res.status(500).send({ message: 'Error al borrar el oficio' });

                    return res.status(200).send({ message: 'Oficio borrado correctamente' });
                });
            } else {
                return res.status(200).send({ message: 'No puedes quedarte sin oficio' });
            }
        }).catch(err => {
            if (err) {
                return res.status(200).send({ message: 'Error al borrar oficios' });
            }
        });
    } else {
        return res.status(200).send({ message: 'El oficio no le pertenece' });
    }

}

/* 
x-www-form-utlencoded:
    *description
    *schedule
    *type -> JobId
    *user

    URL: /update-user-job/:id -> id del trabajo a editar
*/
//Método que actualiza los oficios de un usuario
function updateUserJob(req, res) {

    var userJobId = req.params.id;
    var update = req.body;
    UserJobs.findByIdAndUpdate(userJobId, update, { new: true }, (err, userJobUpdated) => {
        if (err) return res.status(500).send({ message: 'Error en la petición' });

        if (!userJobUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el oficio' });

        return res.status(200).send({
            job: userJobUpdated
        });
    });
}

/*
    URL: /get-user-jobs/:id -> id del cliente con oficios
    URL: /get-user-jobs     -> Todos los oficios creados
*/
//Metodo que retorna los oficios de un usuario o todos los oficios de todos los usuarios
function getUserJobs(req, res) {
    var userId = req.params.id;

    if (userId && userId != 0) {
        UserJobs.find({ user: userId }).populate('jobs').exec((err, userJobs) => {
            if (err) return res.status(200).send({ message: 'Error al buscar oficios' });

            if (!userJobs) return res.status(404).send({ message: 'No hay oficios que mostrar' });

            User.find({ _id: userId }, { password: 0 }).exec((err2, user) => {
                if (err2) return res.status(500).send({ message: 'Error al buscar productos' });

                if (!user) return res.status(404).send({ message: 'No hay productos que mostrar' });

                return res.status(200).send({
                    userJobs,
                    user
                });
            });

        });
    } else {

        var page = 1;
        if (req.params.page) {
            page = req.params.page;
        }
        var itemsPerPage = 5;
        var skip = (page - 1) * itemsPerPage;
        var userJobsArray = new Array();

        UserJobs.aggregate([{ $group: { _id: "$user" } }, { $skip: skip }, { $limit: itemsPerPage }]).exec().then(async function (results) {
            for (let i = 0; i < results.length; i++) {
                await getUser(results[i]).then((value) => {
                    userJobsArray[i] = value;
                });
            }

            //Total de paginas
            var total = await UserJobs.aggregate([{ $group: { _id: "$user" } }, { $count: 'total' }]);
            var totalPages;
            if (total && total > 0) {
                totalPages = Math.ceil(total[0].total / itemsPerPage);
            } else {
                totalPages = 0;
            }

            return res.status(200).send({
                userJobsArray,
                total: totalPages
            });
        }).catch(err => {
            console.log(err);
            if (err) {
                return res.status(500).send({ message: 'Error en la petición' });
            }
        });

    }

}

//Método auxiliar que retorna al usuario y sus oficios
async function getUser(id) {
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


/* 
x-www-form-utlencoded:
    *description
    *schedule
    *type -> JobId
    *user

    URL: /save-user-job
*/
//Metodo que guarda un oficio en un usuarios
function saveUserJob(req, res) {
    //DATOS
    var params = req.body;
    var userId = req.user.sub;
    let userJobs = new UserJobs();
    if (params.description && params.schedule && params.jobId) {

        userJobs.description = params.description;
        //ID del usuario
        userJobs.user = userId;
        userJobs.schedule = params.schedule;
        //ID de los oficios seleccionados
        userJobs.type = params.jobId;

        userJobs.save((err, result) => {
            if (err) return res.status(200).send({ message: 'Error al guardar el oficio' });
            return res.status(200).send({
                userJobs: result
            });

        });

    } else {
        return res.status(500).send({ message: 'Error al agregar el oficio' });
    }

}

/* 
    RUTA POR POST: /get-jobs
*/
//Metodo que retorna los oficios por default
function getJobs(req, res) {
    Jobs.find().exec().then(response => {
        if (response) {
            return res.status(200).send({
                response
            });
        }
    }).catch(err => {
        handleError(err);
    });
}

module.exports = {
    home,
    pruebas,
    saveUserJobs,
    deleteUserJob,
    updateUserJob,
    getUserJobs,
    saveUserJob,
    getJobs
}