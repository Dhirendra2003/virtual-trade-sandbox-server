import multer from "multer";

const storage = multer.diskStorage({
  // destination: function (req, file, callback) {
  //   callback(null, "./uploads/");
  // },
  filename: function (req, file, callback) {
    return callback(null, `${Date.now()}-${file.originalname}`);
  },
});
export const uploader = multer({ storage: storage });
