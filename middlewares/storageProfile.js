const multer = require("multer");

const storage = multer.diskStorage({
    
    destination: function (req, file, cb) {
        cb(null, './uploads/users/profile');
    },
    filename: function (req, file, cb) {
        let type = file.mimetype.split("/")[1];
        cb(null, file.fieldname + '-' + Date.now()+"." + type);
    }
})

const upload = multer({ storage });

module.exports = upload.single("image");