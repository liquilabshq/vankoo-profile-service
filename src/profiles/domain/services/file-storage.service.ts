/** @author LiquiLabs */
export const FILE_STORAGE_SERVICE = 'FILE_STORAGE_SERVICE';

export interface UploadUrlResult {
  uploadUrl: string;
  fileUrl: string;
  expiresInSeconds: number;
}

export interface IFileStorageService {
  generateUploadUrl(objectKey: string): Promise<UploadUrlResult>;
}

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

export const ALLOWED_CONTENT_TYPES = Object.keys(CONTENT_TYPE_EXTENSIONS);

export function resolveFileExtension(contentType: string): string {
  const extension = CONTENT_TYPE_EXTENSIONS[contentType];
  if (!extension) {
    throw new Error(`Tipo de contenido no soportado: ${contentType}`);
  }
  return extension;
}
