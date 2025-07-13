// s3Client.js
import AWS from "aws-sdk";
import dotenv from "dotenv";
import AppError from "../utils/AppError.js";

dotenv.config();

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const BUCKET = process.env.S3_BUCKET_NAME;

const uploadPdf = async (key, pdfData) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: pdfData,
      ContentType: "application/pdf",
    };
    const response = await s3.upload(params).promise();
    return response.Key;
  } catch (error) {
    console.error("Error uploading PDF to S3:", error);
    throw new AppError("Error uploading PDF", 500);
  }
};

const deletePdf = async (key) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key,
    };
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error("Error deleting PDF from S3:", error);
    throw new AppError("Error deleting PDF", 500);
  }
};

/**
 * Permanently deletes the latest version of a file from S3.
 * Ignores delete markers.
 * @param {string} key - The S3 object key (e.g., "receipts/123/file.pdf")
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const getVersionsPdf = async (key) => {
  try {
    const versionData = await s3
      .listObjectVersions({
        Bucket: BUCKET,
        Prefix: key,
      })
      .promise();
    return versionData;
  } catch (error) {
    console.error("Error fetching version data:", error);
    throw new AppError("Error fetching version data", 500);
  }
};

const permanentDeleteLatestPdf = async (key) => {
  try {
    const versionData = await getVersionsPdf(key);

    const latestVersion = (versionData.Versions || []).find(
      (v) => v.Key === key && v.IsLatest
    );

    if (latestVersion) {
      await s3
        .deleteObject({
          Bucket: BUCKET,
          Key: key,
          VersionId: latestVersion.VersionId,
        })
        .promise();
    }
  } catch (error) {
    console.error("Permanent delete failed:", error);
    throw new AppError(error.message || "Permanent delete failed", 500);
  }
};

const getPdf = async (key) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key,
    };
    try{
      await s3.headObject(params).promise();
    }
    catch (error) {
      console.error("Error getting PDF from S3 pdf not found:", error);
      throw new AppError("File does not exist", 404);
    } 
    const s3Stream = s3.getObject(params).createReadStream();
    return s3Stream;
  } catch (error) {
    console.error("Error getting PDF from S3:", error);
    throw new AppError("Server error", 500);
  }
};


const updatePdf = async (key, pdfData) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: pdfData,
      ContentType: "application/pdf",
    };
    await s3.upload(params).promise();
  } catch (error) {
    console.error("Error updating PDF in S3:", error);
    throw new AppError("Error updating PDF", 500);
  }
};

const rollbackFileToOldest = async (key) => {
  try {
    const { Versions: versions } = await getVersionsPdf(key);
    if (!versions || versions.Versions.length === 1)
      throw new AppError("No versions to rollback", 400);

    const sorted = versions
      .filter((v) => v.Key === key)
      .sort((a, b) => new Date(a.LastModified) - new Date(b.LastModified)); // Oldest first

    const oldestVersionId = sorted[0].VersionId;
    const params = { Bucket: BUCKET, Key: key, VersionId: oldestVersionId };
    const { Body } = await s3.getObject(params).promise();
    try {
      await updatePdf(key, Body);
    } catch (error) {
      console.error("Error updating file to oldest version: ", error);
      throw new AppError("Error updating file to oldest version", 500);
    }
    const params2 = { Bucket: BUCKET, Key: key, VersionId: oldestVersionId };
    try {
      await s3.deleteObject(params2).promise();
    } catch (error) {
      console.error("Error deleting oldest version: ", error);
      throw new AppError("Error deleting oldest version", 500);
    }
  } catch (error) {
    console.error("Error rolling back file to oldest version:", error);
    throw new AppError("Error rolling back file to oldest version", 500);
  }
};

export {
  uploadPdf,
  deletePdf,
  getVersionsPdf,
  permanentDeleteLatestPdf,
  getPdf,
  updatePdf,
  rollbackFileToOldest,
};
