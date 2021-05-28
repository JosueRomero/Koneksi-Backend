const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/userServices');
    },
    filename: function (req, file, cb) {
        if (file != null) {
            let type = file.mimetype.split("/")[1];
            cb(null, file.fieldname + '-' + Date.now() + "." + type);
        }
    }
})

const upload = multer({ storage });

module.exports = upload.array("services");