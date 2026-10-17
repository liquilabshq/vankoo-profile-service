/** @author LiquiLabs */
export const FILE_STORAGE_SERVICE = 'FILE_STORAGE_SERVICE';

export interface UploadUrlResult {
  uploadUrl: string;
  fileUrl: string;
  expiresInSeconds: number;
}

export interface IFileStorageService {
  generateUploadUrl(objectKey: string): Promise<UploadUrlResult>;
  /**
   * La clave del objeto si la URL es de este almacenamiento (la que devolvió
   * generateUploadUrl como fileUrl), o null si apunta a otro sitio.
   */
  resolveObjectKey(fileUrl: string): string | null;
}

/** Quita la base pública de una URL de este almacenamiento; null si no empieza por ella. */
export function objectKeyFromUrl(
  publicBaseUrl: string,
  fileUrl: string,
): string | null {
  const base = publicBaseUrl.replace(/\/+$/, '') + '/';
  if (!fileUrl.startsWith(base)) return null;
  const key = fileUrl.slice(base.length);
  return key && !key.includes('..') && !key.includes('?') ? key : null;
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
