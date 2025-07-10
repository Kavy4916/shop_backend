import multer from 'Multer';

 const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per image
  fileFilter: (req, file, cb) => {
    const types = ["image/jpeg", "image/jpg", "image/png"];
    if (types.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG/PNG images allowed"), false);
  },
});


const processImage = (req, res, next) => {
  const handler = upload.array("images", 10);
  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // e.g., file too big
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // e.g., rejected by fileFilter
      return res.status(400).json({ message: "Only JPG/PNG images allowed(max 15MB per image)" });
    }
    next(); // All good
  });
};

export {processImage};