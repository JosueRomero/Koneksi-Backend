'use strict'

var UserProducts = require('../models/UserProducts');
var User = require('../models/User');
var uploadProducts = require("../middlewares/storageProducts");
const Transaction = require("mongoose-transactions");
const cloudinary = require('../middlewares/cloudinary');

/*------------------- CLOUDINARY --------------*/
//API para que conecta con CLOUDINARY para almacenar fotos
const cloudinaryApi = require('cloudinary');
const dotenv = require('dotenv');

dotenv.config({ path: 'cloudinary.env' });

cloudinaryApi.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
//-------------------------------------------

var fs = require('fs');
var path = require('path');
const { url } = require('inspector');


//-------PRUEBAS--------
function home(req, res) {
    res.status(200).send({ message: 'Hola mundo' });
}

function pruebas(req, res) {
    res.status(200).send({ message: 'Accion de pruebas en el servidor de nodejs' });
}
//---------------------

/* 
FORM-DATA:
    *name
    *description
    *price
    *product [image]
    *id -> id del user 
    *tags -> ["tag1,tag2"] 

    URL: /save-products
*/
//Metodo que guarda los productos de un usuario en el registro
function saveProducts(req, res) {
    uploadProducts(req, res, async function (err) {
        if (err) {

            console.log(err);
            return res.end("Error uploading file");
        }
        //Transacción
        var transaction = new Transaction();
        //Modelo
        var userProducts = new UserProducts();
        //Datos
        var params = req.body;
        var file_name = req.files;
        var error = false;

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/userProducts');
        var files = req.files;

        if (req.method === 'POST') {
            var urls = new Array();
            for (const file of files) {
                const { path } = file;
                const newPath = await uploader(path)
                urls.push(newPath)
                fs.unlinkSync(path)
            }

        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }

        console.log(urls[0]);
        try {

            if (!Array.isArray(params.description)) {
                userProducts.name = params.name;
                userProducts.original_name = params.name;
                userProducts.description = params.description;
                userProducts.price = params.price;
                userProducts.image = urls;
                userProducts.user = params.id;

                //Se representa como ["tag1,tag2", "tag1,tag2"] 
                userProducts.tags = params.tags.split(',');

                transaction.insert('UserProducts', userProducts);
            } else {
                for (let i = 0; i < params.name.length; i++) {
                    userProducts = new UserProducts();
                    if (params.name[i] && params.description[i] && params.price[i] && file_name[i].filename && params.id) {

                        userProducts.name = params.name[i].toLowerCase();
                        userProducts.original_name = params.name[i];
                        userProducts.description = params.description[i];
                        userProducts.price = params.price[i];
                        userProducts.image = urls[i];
                        userProducts.user = params.id;

                        //Se representa como ["tag1,tag2", "tag1,tag2"] 
                        userProducts.tags = params.tags[i].split(',');

                        transaction.insert('UserProducts', userProducts);

                    } else {
                        error = true;
                    }
                }
            }



            if (!error) {
                transaction.run();
                return res.status(200).send({ message: "Productos agregados con éxito" });
            } else {
                transaction.rollback();
                transaction.clean();
                for (let i = 0; i < file_name.length; i++) {
                    removeFileOfUploads(urls[i].id);
                }
                return res.status(200).send({ message: "Error al agregar los productos" });
            }

        } catch (error) {
            console.log(error);
            for (let i = 0; i < file_name.length; i++) {
                removeFileOfUploads(urls[i]);
            }
            console.error(error);
            transaction.rollback().catch(console.error);
            transaction.clean();
            console.log(transaction);
            return res.status(200).send({ message: "Error al agregar los productos" });
        }
    });
}

/* 
    URL: /deleteProduct/:id -> id del producto a eliminar
    INCLUDE - AUTHENTICATION
*/
//Método que elimina un producto de un usuario
function deleteProduct(req, res) {
    var productId = req.params.id;
    var productImagePath = "";
    var userProductId = 0;

    UserProducts.findById({ '_id': productId }, (err, product) => {
        productImagePath = product.image[0].id;
        userProductId = product.user;

        //Se comrpueba que el que va a borrar el producto, sea el que lo creó
        if (userProductId == req.user.sub) {
            UserProducts.deleteOne({ 'user': req.user.sub, '_id': productId }, (err, result) => {
                if (err) return res.status(500).send({ message: 'Error al borrar el product' });

                removeFileOfUploads(productImagePath);

                return res.status(200).send({ message: 'Producto borrado correctamente' });
            });
        }
    });


}

/* 
FORM-DATA:
    *name
    *description
    *price
    *product [image]

    URL: /update-product/:id -> id del producto a editar
    INCLUDE - AUTHENTICATION
*/
//Método que actualiza los productos
function updateProduct(req, res) {

    uploadProducts(req, res, async function (err) {
        if (err) {
            return res.end("Error uploading file 2");
        }
        var productId = req.params.id;
        var update = req.body;
        var productImagePath = "";

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/userProducts');
        var file = req.files;

        if (req.method === 'POST') {
            var urls = new Array();
            const { path } = file;
            const newPath = await uploader(path)
            urls.push(newPath)
            fs.unlinkSync(path)
        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }

        if (req.files && req.files[0]) {
            UserProducts.findById({ '_id': productId }, (err, product) => {
                productImagePath = product.image[0].id;
            });

            update.image = urls;
        }
        UserProducts.findByIdAndUpdate(productId, update, { new: true }, (err, productUpdated) => {
            if (err) return res.status(500).send({ message: 'Error en la petición' });

            if (!productUpdated) return res.status(404).send({ message: 'No se ha podido actualizar el producto' });
            if (req.files && req.files[0]) removeFileOfUploads(productImagePath);

            return res.status(200).send({
                product: productUpdated
            });
        });
    });
}
/* 
FORM-DATA:
    *name
    *description
    *price
    *product

    URL: /save-product
    INCLUDE - AUTHETICATION
*/
//Método que guarda los productos de un usuario 
function saveProduct(req, res) {
    uploadProducts(req, res,async function (err) {
        if (err) {
            return res.end("Error uploading file 2");
        }

        const uploader = async (path) => await cloudinary.uploads(path, 'uploads/userProducts');
        var file = req.file;

        if (req.method === 'POST') {
            var urls = new Array();
            const { path } = file;
            const newPath = await uploader(path)
            urls.push(newPath)
            fs.unlinkSync(path)
        } else {
            res.status(405).json({
                err: `${req.method} method not allowed`
            })
        }

        //DATOS
        var params = req.body;
        var file_name = urls;

        let userProducts = new UserProducts();

        userProducts.name = params.name.toLowerCase();
        userProducts.original_name = params.name;
        userProducts.description = params.description;
        userProducts.price = params.price;
        userProducts.image = file_name;
        userProducts.user = req.user.sub;

        userProducts.save((err, productStored) => {
            if (err) {
                removeFileOfUploads(file_name.id);
                return res.status(200).send({ message: 'Error al guardar el producto' });
            }

            if (productStored) {
                res.status(200).send({ user: productStored });
            } else {
                removeFileOfUploads(file_name.id);
                return res.status(200).send({ message: 'Error al guardar el producto' });
            }
        });
    });
}

/* 
    URL: /get-products/:id -> id de un cliente
    URL: /get-products     -> Todos los productos
*/
//Método que retorna los productos en general o los productos de un usuario
async function getProducts(req, res) {
    var userId = req.params.id;

    if (userId && userId != 0) {
        UserProducts.find({ user: userId }, { user: 0 }).exec((err1, products) => {
            if (err1) return res.status(500).send({ message: 'Error al buscar productos' });

            if (!products) return res.status(404).send({ message: 'No hay productos que mostrar' });

            User.find({ _id: userId }, { password: 0 }).exec((err2, user) => {
                if (err2) return res.status(500).send({ message: 'Error al buscar productos' });

                if (!user) return res.status(404).send({ message: 'No hay productos que mostrar' });

                return res.status(200).send({
                    products,
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
        var userProductsArray = new Array();
        var skip = (page - 1) * itemsPerPage;
        //Retorna el id de los usuarios con productos
        UserProducts.aggregate([{ $group: { _id: "$user" } }, { $skip: skip }, { $limit: itemsPerPage }]).exec().then(async function (results) {
            for (let i = 0; i < results.length; i++) {
                await getUser(results[i]).then((value) => {
                    userProductsArray[i] = value;
                });

            }

            //Total de paginas
            var total = await UserProducts.aggregate([{ $group: { _id: "$user" } }, { $count: 'total' }]);
            var totalPages;
            if (total[0]) {
                totalPages = Math.ceil(total[0].total / itemsPerPage);
            } else {
                totalPages = 0;
            }

            return res.status(200).send({
                userProductsArray,
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

//Metodo auxiliar que retorna al usuario y sus productos
async function getUser(id) {
    var usuario = await User.find({ _id: id }, { password: 0 }).exec().then((result) => {
        return result[0];

    }).catch((err) => {
        return handleError(err);
    });


    var productos = await UserProducts.find({ user: id }).limit(3).exec().then((result) => {
        return result;
    }).catch((err) => {
        return handleError(err);
    });

    return {
        'user': usuario,
        'productos': productos
    };


}

//Método que remueve los archivos del servidor cloudinary
function removeFileOfUploads(old_file_name) {
    cloudinaryApi.v2.uploader.destroy(old_file_name, function (result) { console.log(result) });
}



module.exports = {
    home,
    pruebas,
    saveProducts,
    deleteProduct,
    updateProduct,
    saveProduct,
    getProducts
}