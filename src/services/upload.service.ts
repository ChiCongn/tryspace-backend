import type { UploadApiResponse } from "cloudinary";

import { cloudinary } from "../lib/cloudinary";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

type ImagePurpose = "avatar" | "review" | "design" | "design-thumbnail";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_PURPOSES: Record<ImagePurpose, { folder: string; maxBytes: number }> = {
  avatar: { folder: "tryspace/avatars", maxBytes: 5 * 1024 * 1024 },
  review: { folder: "tryspace/reviews", maxBytes: 10 * 1024 * 1024 },
  design: { folder: "tryspace/designs", maxBytes: 5 * 1024 * 1024 },
  "design-thumbnail": { folder: "tryspace/designs", maxBytes: 5 * 1024 * 1024 }
};
const uploadLogger = logger.child({ context: "upload service" });

function uploadBuffer(buffer: Buffer, options: Record<string, unknown>): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Cloudinary upload failed"));
        return;
      }

      resolve(result);
    });

    stream.end(buffer);
  });
}

function imagePurpose(value: unknown): ImagePurpose {
  if (value === "avatar" || value === "review" || value === "design" || value === "design-thumbnail") {
    return value;
  }

  throw new ApiError(400, "VALIDATION_ERROR", "purpose không hợp lệ");
}

function ensureFile(file: Express.Multer.File | undefined): Express.Multer.File {
  if (!file) {
    throw new ApiError(400, "VALIDATION_ERROR", "File là bắt buộc");
  }

  return file;
}

export async function uploadImage(fileInput: Express.Multer.File | undefined, purposeInput: unknown) {
  const file = ensureFile(fileInput);
  const purpose = imagePurpose(purposeInput);
  const config = IMAGE_PURPOSES[purpose];

  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new ApiError(415, "UNSUPPORTED_FILE_TYPE", "Chỉ chấp nhận JPEG, PNG hoặc WebP");
  }

  if (file.size > config.maxBytes) {
    throw new ApiError(413, "FILE_TOO_LARGE", "File vượt quá giới hạn kích thước", {
      maxBytes: config.maxBytes
    });
  }

  const result = await uploadBuffer(file.buffer, {
    folder: config.folder,
    resource_type: "image",
    ...(purpose === "avatar" ? { transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }] } : {})
  });

  uploadLogger.info(`Uploaded image for ${purpose} to ${config.folder}`, {
    purpose,
    folder: config.folder,
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}

function isGlb(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer[0] === 0x67 && buffer[1] === 0x6c && buffer[2] === 0x54 && buffer[3] === 0x46;
}

export async function uploadModel(fileInput: Express.Multer.File | undefined) {
  const file = ensureFile(fileInput);
  const maxBytes = 50 * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new ApiError(413, "FILE_TOO_LARGE", "File model vượt quá giới hạn 50MB", {
      maxBytes
    });
  }

  if (!isGlb(file.buffer)) {
    throw new ApiError(415, "UNSUPPORTED_FILE_TYPE", "Chỉ chấp nhận file GLB hợp lệ");
  }

  const result = await uploadBuffer(file.buffer, {
    folder: "tryspace/models",
    resource_type: "raw"
  });

  uploadLogger.info("Uploaded 3D model to tryspace/models", {
    folder: "tryspace/models",
    publicId: result.public_id,
    bytes: result.bytes
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes
  };
}
