use candid::{CandidType, Principal};
use ic_cdk::api::time;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FileMetadata {
    pub file_id: String,
    pub original_name: String,
    pub mime_type: String,
    pub size: u64,
    pub uploaded_by: Principal,
    pub uploaded_at: u64,
    pub asset_id: Option<String>,    // Link to asset verification
    pub identity_id: Option<String>, // Link to identity
    pub file_hash: String,           // SHA-256 hash for integrity
    pub is_public: bool,
    pub tags: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FileChunk {
    pub file_id: String,
    pub chunk_index: u32,
    pub total_chunks: u32,
    pub data: Vec<u8>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct StoredFile {
    pub metadata: FileMetadata,
    pub chunks: Vec<Vec<u8>>, // File data split into chunks
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum FileType {
    Document, // PDF, DOC, etc.
    Image,    // JPG, PNG, etc.
    Other,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FileUploadRequest {
    pub original_name: String,
    pub mime_type: String,
    pub data: Vec<u8>,
    pub asset_id: Option<String>,
    pub identity_id: Option<String>,
    pub tags: Vec<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct FileUploadResponse {
    pub file_id: String,
    pub url: Option<String>, // Optional URL for accessing the file
}

pub struct FileStorageService {
    pub files: HashMap<String, StoredFile>,
    pub file_index: HashMap<Principal, Vec<String>>, // User -> File IDs
    pub asset_files: HashMap<String, Vec<String>>,   // Asset ID -> File IDs
    pub identity_files: HashMap<String, Vec<String>>, // Identity ID -> File IDs
}

impl Default for FileStorageService {
    fn default() -> Self {
        Self::new()
    }
}

impl FileStorageService {
    pub fn new() -> Self {
        Self {
            files: HashMap::new(),
            file_index: HashMap::new(),
            asset_files: HashMap::new(),
            identity_files: HashMap::new(),
        }
    }

    pub fn upload_file(
        &mut self,
        request: FileUploadRequest,
        uploader: Principal,
    ) -> Result<FileUploadResponse, String> {
        // Validate file size (max 10MB for now)
        const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB
        if request.data.len() > MAX_FILE_SIZE {
            return Err("File size exceeds maximum limit (10MB)".to_string());
        }

        // Validate file type
        if !self.is_supported_file_type(&request.mime_type) {
            return Err("Unsupported file type".to_string());
        }

        // Generate unique file ID
        let file_id = format!(
            "file_{}_{}_{}",
            time(),
            &uploader.to_string()[..8],
            request.original_name.len()
        );

        // Calculate file hash
        let file_hash = self.calculate_file_hash(&request.data);

        // Split file into chunks for storage efficiency
        const CHUNK_SIZE: usize = 64 * 1024; // 64KB chunks
        let chunks: Vec<Vec<u8>> = request
            .data
            .chunks(CHUNK_SIZE)
            .map(|chunk| chunk.to_vec())
            .collect();

        // Create file metadata
        let metadata = FileMetadata {
            file_id: file_id.clone(),
            original_name: request.original_name,
            mime_type: request.mime_type,
            size: request.data.len() as u64,
            uploaded_by: uploader,
            uploaded_at: time(),
            asset_id: request.asset_id.clone(),
            identity_id: request.identity_id.clone(),
            file_hash,
            is_public: false, // Default to private
            tags: request.tags,
        };

        // Create stored file
        let stored_file = StoredFile {
            metadata: metadata.clone(),
            chunks,
        };

        // Store the file
        self.files.insert(file_id.clone(), stored_file);

        // Update indices
        self.file_index
            .entry(uploader)
            .or_default()
            .push(file_id.clone());

        if let Some(asset_id) = &request.asset_id {
            self.asset_files
                .entry(asset_id.clone())
                .or_default()
                .push(file_id.clone());
        }

        if let Some(identity_id) = &request.identity_id {
            self.identity_files
                .entry(identity_id.clone())
                .or_default()
                .push(file_id.clone());
        }

        Ok(FileUploadResponse {
            file_id,
            url: None, // We can add URL generation later
        })
    }

    pub fn get_file(&self, file_id: &str, requester: Principal) -> Result<Vec<u8>, String> {
        match self.files.get(file_id) {
            Some(stored_file) => {
                // Check access permissions
                if !self.can_access_file(&stored_file.metadata, requester) {
                    return Err("Access denied".to_string());
                }

                // Reconstruct file from chunks
                let mut file_data = Vec::new();
                for chunk in &stored_file.chunks {
                    file_data.extend(chunk);
                }

                Ok(file_data)
            }
            None => Err("File not found".to_string()),
        }
    }

    pub fn get_file_metadata(
        &self,
        file_id: &str,
        requester: Principal,
    ) -> Result<FileMetadata, String> {
        match self.files.get(file_id) {
            Some(stored_file) => {
                if !self.can_access_file(&stored_file.metadata, requester) {
                    return Err("Access denied".to_string());
                }
                Ok(stored_file.metadata.clone())
            }
            None => Err("File not found".to_string()),
        }
    }

    pub fn get_user_files(&self, user: Principal) -> Vec<FileMetadata> {
        match self.file_index.get(&user) {
            Some(file_ids) => file_ids
                .iter()
                .filter_map(|id| self.files.get(id))
                .map(|file| file.metadata.clone())
                .collect(),
            None => Vec::new(),
        }
    }

    pub fn get_asset_files(
        &self,
        asset_id: &str,
        requester: Principal,
    ) -> Result<Vec<FileMetadata>, String> {
        match self.asset_files.get(asset_id) {
            Some(file_ids) => {
                let mut accessible_files = Vec::new();
                for file_id in file_ids {
                    if let Some(stored_file) = self.files.get(file_id) {
                        if self.can_access_file(&stored_file.metadata, requester) {
                            accessible_files.push(stored_file.metadata.clone());
                        }
                    }
                }
                Ok(accessible_files)
            }
            None => Ok(Vec::new()),
        }
    }

    pub fn delete_file(&mut self, file_id: &str, requester: Principal) -> Result<(), String> {
        match self.files.get(file_id) {
            Some(stored_file) => {
                // Check if user owns the file
                if stored_file.metadata.uploaded_by != requester {
                    return Err("Only file owner can delete".to_string());
                }

                let uploader = stored_file.metadata.uploaded_by;
                let asset_id = stored_file.metadata.asset_id.clone();
                let identity_id = stored_file.metadata.identity_id.clone();

                // Remove from main storage
                self.files.remove(file_id);

                // Clean up indices
                if let Some(user_files) = self.file_index.get_mut(&uploader) {
                    user_files.retain(|id| id != file_id);
                }

                if let Some(asset_id) = asset_id {
                    if let Some(asset_files) = self.asset_files.get_mut(&asset_id) {
                        asset_files.retain(|id| id != file_id);
                    }
                }

                if let Some(identity_id) = identity_id {
                    if let Some(identity_files) = self.identity_files.get_mut(&identity_id) {
                        identity_files.retain(|id| id != file_id);
                    }
                }

                Ok(())
            }
            None => Err("File not found".to_string()),
        }
    }

    fn can_access_file(&self, metadata: &FileMetadata, requester: Principal) -> bool {
        // Owner can always access
        if metadata.uploaded_by == requester {
            return true;
        }

        // Public files can be accessed by anyone
        if metadata.is_public {
            return true;
        }

        // TODO: Add more sophisticated access control (e.g., sharing permissions)
        false
    }

    fn is_supported_file_type(&self, mime_type: &str) -> bool {
        const SUPPORTED_TYPES: &[&str] = &[
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "text/csv",
        ];

        SUPPORTED_TYPES.contains(&mime_type)
    }

    fn calculate_file_hash(&self, data: &[u8]) -> String {
        use sha2::{Digest, Sha256};
        let mut hasher = Sha256::new();
        hasher.update(data);
        format!("{:x}", hasher.finalize())
    }
}
