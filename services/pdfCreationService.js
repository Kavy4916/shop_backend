import { PDFDocument, rgb } from "pdf-lib";
import sharp from "sharp";
import AppError from "../utils/AppError.js";

const createPdf = async (files) => {
  if (!files || files.length === 0){
    console.error("No files provided");
    throw new AppError("Server error", 500);
  }

  try {
    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
      const buffer = await sharp(file.buffer)
        .resize({ width: 800 })
        .jpeg({ quality: 80 })
        .toBuffer();

      const image = await pdfDoc.embedJpg(buffer);
      const page = pdfDoc.addPage([image.width, image.height]);

      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error("Error creating PDF:", err);
    throw new AppError("Server error", 500);
  }
};

export default createPdf;
