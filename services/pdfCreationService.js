import { PDFDocument, rgb } from "pdf-lib";
import sharp from "sharp";
import AppError from "../utils/AppError.js";

const createPdf = async (files) => {
  if (!files || files.length === 0) {
    throw new AppError("No files provided", 400);
  }

  try {
    const pdfDoc = await PDFDocument.create();
    
    // Process all images in parallel
    const imageProcessingPromises = files.map(async (file) => {
      try {
        const metadata = await sharp(file.buffer).metadata();
        const isTransparent = metadata.hasAlpha;
        const format = isTransparent ? 'png' : 'jpeg';
        
        return sharp(file.buffer)
          .rotate() // Auto-orient based on EXIF
          .resize({ 
            width: 800, 
            withoutEnlargement: true, // Don't enlarge smaller images
            fit: 'inside' // Maintain aspect ratio
          })
          [format]({ 
            quality: 80, 
            ...(isTransparent ? { compressionLevel: 9 } : {}) 
          })
          .toBuffer()
          .then(buffer => ({ buffer, format }));
      } catch (err) {
        console.error(`Error processing file ${file.originalname || 'unknown'}:`, err);
        throw new AppError(`Error processing image: ${file.originalname || 'file'}`, 500);
      }
    });

    // Wait for all images to process
    const processedImages = await Promise.all(imageProcessingPromises);
    
    // Add images to PDF
    for (const [index, { buffer, format }] of processedImages.entries()) {
      const file = files[index];
      try {
        const image = format === 'png' 
          ? await pdfDoc.embedPng(buffer) 
          : await pdfDoc.embedJpg(buffer);
        
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } catch (err) {
        console.error(`Error embedding file ${file.originalname || 'unknown'}:`, err);
        throw new AppError(`Error embedding image: ${file.originalname || 'file'}`, 500);
      }
    }

    return await pdfDoc.save();
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("Error creating PDF:", err);
    throw new AppError("Failed to create PDF document", 500);
  }
};

export default createPdf;