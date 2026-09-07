import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export interface SavedFileResult {
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export async function saveUploadedFile(file: File, subFolder: string = 'documents'): Promise<SavedFileResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('FILE_TOO_LARGE: ขนาดไฟล์ต้องไม่เกิน 15 MB');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('INVALID_MIME_TYPE: อนุญาตเฉพาะไฟล์ PDF, JPG, PNG เท่านั้น');
  }

  const rawExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(rawExt)) {
    throw new Error('INVALID_EXTENSION: นามสกุลไฟล์ไม่อยู่ในรายการที่อนุญาต');
  }

  // Prevent directory traversal by sanitizing subfolder
  const safeSubFolder = subFolder.replace(/[^a-zA-Z0-9_-]/g, '');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', safeSubFolder);
  await fs.mkdir(uploadDir, { recursive: true });

  // Generate cryptographic randomized filename
  const randomHex = crypto.randomBytes(16).toString('hex');
  const safeFileName = `${randomHex}${rawExt}`;
  const targetPath = path.join(uploadDir, safeFileName);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(targetPath, buffer);

  return {
    fileName: safeFileName,
    originalFileName: file.name.substring(0, 100),
    filePath: targetPath,
    fileUrl: `/uploads/${safeSubFolder}/${safeFileName}`,
    mimeType: file.type,
    fileSize: file.size,
  };
}
