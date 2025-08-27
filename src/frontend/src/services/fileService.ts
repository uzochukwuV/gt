import { backend } from "../../../declarations/backend";
import type { 
  FileUploadRequest as CandidFileUploadRequest,
  FileMetadata as CandidFileMetadata,
} from "../../../declarations/backend/backend.did";

// Frontend-friendly types
export interface FileUploadRequest {
  original_name: string;
  mime_type: string;
  data: number[]; // Uint8Array as number array for Candid
  asset_id?: string;
  identity_id?: string;
  tags: string[];
}

export interface FileUploadResponse {
  file_id: string;
  url?: string;
}

export interface FileMetadata {
  file_id: string;
  original_name: string;
  mime_type: string;
  size: bigint;
  uploaded_by: string; // Principal as string
  uploaded_at: bigint;
  asset_id?: string;
  identity_id?: string;
  file_hash: string;
  is_public: boolean;
  tags: string[];
}

// Helper functions to convert between frontend and Candid types
function toOptionalArray<T>(value: T | undefined): [] | [T] {
  return value ? [value] : [];
}

function fromOptionalArray<T>(value: [] | [T]): T | undefined {
  return value.length > 0 ? value[0] : undefined;
}

function toFrontendFileMetadata(metadata: CandidFileMetadata): FileMetadata {
  return {
    file_id: metadata.file_id,
    original_name: metadata.original_name,
    mime_type: metadata.mime_type,
    size: metadata.size,
    uploaded_by: metadata.uploaded_by.toText(),
    uploaded_at: metadata.uploaded_at,
    asset_id: fromOptionalArray(metadata.asset_id),
    identity_id: fromOptionalArray(metadata.identity_id),
    file_hash: metadata.file_hash,
    is_public: metadata.is_public,
    tags: metadata.tags,
  };
}

export const fileService = {
  /**
   * Upload a file to the backend
   */
  async uploadFile(
    file: File,
    assetId?: string,
    identityId?: string,
    tags: string[] = []
  ): Promise<FileUploadResponse> {

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to Candid format
    const candidRequest: CandidFileUploadRequest = {
      original_name: file.name,
      mime_type: file.type,
      data: Array.from(uint8Array),
      asset_id: toOptionalArray(assetId),
      identity_id: toOptionalArray(identityId),
      tags,
    };

    try {
      const result = await backend.upload_file(candidRequest);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }
      
      return {
        file_id: result.Ok.file_id,
        url: fromOptionalArray(result.Ok.url),
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  },

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {

    try {
      const result = await backend.get_file_metadata(fileId);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }
      
      return toFrontendFileMetadata(result.Ok);
    } catch (error) {
      console.error('Failed to get file metadata:', error);
      throw error;
    }
  },

  /**
   * Get all files uploaded by the current user
   */
  async getUserFiles(): Promise<FileMetadata[]> {

    try {
      const result = await backend.get_user_files();
      return result.map(toFrontendFileMetadata);
    } catch (error) {
      console.error('Failed to get user files:', error);
      throw error;
    }
  },

  /**
   * Get files associated with an asset
   */
  async getAssetFiles(assetId: string): Promise<FileMetadata[]> {

    try {
      const result = await backend.get_asset_files(assetId);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }
      
      return result.Ok.map(toFrontendFileMetadata);
    } catch (error) {
      console.error('Failed to get asset files:', error);
      throw error;
    }
  },

  /**
   * Download a file
   */
  async downloadFile(fileId: string): Promise<Uint8Array> {

    try {
      const result = await backend.download_file(fileId);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }
      
      return new Uint8Array(result.Ok);
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  },

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {

    try {
      const result = await backend.delete_file(fileId);
      
      if ('Err' in result) {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('File deletion failed:', error);
      throw error;
    }
  },

  /**
   * Create a download URL from file data
   */
  createDownloadUrl(fileData: Uint8Array, mimeType: string): string {
    const blob = new Blob([new Uint8Array(fileData)], { type: mimeType });
    return URL.createObjectURL(blob);
  },

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported file type' };
    }

    return { valid: true };
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file type icon
   */
  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('text')) return '📄';
    return '📎';
  },
};

export default fileService;