const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase client - use service role key for storage operations (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Use service role key if available (for backend operations), otherwise use anon key
let supabaseStorage;
if (supabaseUrl && supabaseServiceRoleKey) {
  // Service role key bypasses RLS - perfect for backend operations
  supabaseStorage = createClient(supabaseUrl, supabaseServiceRoleKey);
} else if (supabaseUrl && supabaseAnonKey) {
  // Fallback to anon key (requires RLS policies to be set)
  supabaseStorage = createClient(supabaseUrl, supabaseAnonKey);
} else {
  supabaseStorage = null;
}

class StorageService {
  /**
   * Upload file ke Supabase Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {String} fileName - Nama file
   * @param {String} bucket - Nama bucket (default: 'avatars')
   * @param {String} folder - Folder path (default: '')
   * @returns {Promise<Object>} { url, path }
   */
  static async uploadFile(fileBuffer, fileName, bucket = 'avatars', folder = '') {
    try {
      if (!supabaseStorage) {
        throw new Error('Supabase Storage client not initialized. Pastikan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_ANON_KEY sudah di-set di .env');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}-${randomStr}.${fileExtension}`;
      
      const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

      // Upload to Supabase Storage
      const { data, error } = await supabaseStorage.storage
        .from(bucket)
        .upload(filePath, fileBuffer, {
          contentType: this.getContentType(fileExtension),
          upsert: false
        });

      if (error) {
        // Handle specific errors
        if (error.message && error.message.includes('Bucket not found')) {
          throw new Error(`Bucket '${bucket}' tidak ditemukan. Pastikan bucket sudah dibuat di Supabase Dashboard.`);
        }
        if (error.message && error.message.includes('row-level security policy')) {
          throw new Error(`RLS Policy Error: Bucket '${bucket}' memerlukan Row Level Security policy. Silakan setup policy di Supabase Dashboard → Storage → Policies untuk bucket '${bucket}'.`);
        }
        if (error.statusCode === '403' || error.statusCode === 403) {
          throw new Error(`Access Denied: Tidak memiliki permission untuk upload ke bucket '${bucket}'. Periksa RLS policies di Supabase Dashboard.`);
        }
        
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const urlResponse = supabaseStorage.storage
        .from(bucket)
        .getPublicUrl(filePath);

      let publicUrl;
      if (urlResponse && urlResponse.data && urlResponse.data.publicUrl) {
        publicUrl = urlResponse.data.publicUrl;
      } else {
        // Fallback: construct URL manually
        const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
        publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
      }

      return {
        url: publicUrl,
        path: filePath,
        fileName: uniqueFileName
      };
    } catch (error) {
      throw error;
    }
  }


  static async deleteFile(filePath, bucket = 'avatars') {
    try {
      if (!supabaseStorage) {
        throw new Error('Supabase Storage client not initialized');
      }
      const { error } = await supabaseStorage.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Storage delete error: ${error.message}`);
    }
  }


  static getContentType(extension) {
    const contentTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    return contentTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  static validateFile(file, maxSize = 5 * 1024 * 1024) {
    if (!file) {
      return { valid: false, error: 'File is required' };
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'File type not allowed. Allowed: JPEG, PNG, GIF, WebP' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
    }

    return { valid: true };
  }
}

module.exports = StorageService;
