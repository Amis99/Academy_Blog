import fs from 'fs';
import path from 'path';

export class FilePersistenceManager {
  private uploadsDir: string;
  
  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDirectory();
  }
  
  private ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log(`[PERSISTENCE] Created uploads directory: ${this.uploadsDir}`);
    }
    
    // Set proper permissions
    try {
      fs.chmodSync(this.uploadsDir, 0o755);
      console.log(`[PERSISTENCE] Set permissions for uploads directory`);
    } catch (err) {
      console.warn(`[PERSISTENCE] Could not set uploads directory permissions:`, err);
    }
  }
  
  // Verify file exists and is accessible
  public verifyFile(filename: string): boolean {
    const filePath = path.join(this.uploadsDir, filename);
    return fs.existsSync(filePath);
  }
  
  // Get file stats
  public getFileStats(filename: string) {
    const filePath = path.join(this.uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      return fs.statSync(filePath);
    }
    return null;
  }
  
  // Clean up orphaned files (files not referenced in database)
  public cleanupOrphanedFiles(referencedFiles: string[]) {
    const existingFiles = fs.readdirSync(this.uploadsDir);
    let cleanedCount = 0;
    
    existingFiles.forEach(file => {
      const fullPath = `/uploads/${file}`;
      if (!referencedFiles.includes(fullPath)) {
        try {
          fs.unlinkSync(path.join(this.uploadsDir, file));
          cleanedCount++;
          console.log(`[PERSISTENCE] Cleaned up orphaned file: ${file}`);
        } catch (err) {
          console.warn(`[PERSISTENCE] Could not delete orphaned file ${file}:`, err);
        }
      }
    });
    
    console.log(`[PERSISTENCE] Cleaned up ${cleanedCount} orphaned files`);
    return cleanedCount;
  }
  
  // Get all existing files
  public getAllFiles(): string[] {
    if (!fs.existsSync(this.uploadsDir)) {
      return [];
    }
    return fs.readdirSync(this.uploadsDir);
  }
}

export const filePersistence = new FilePersistenceManager();