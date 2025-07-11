import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { filePersistence } from "./file-persistence";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure uploads directory has proper permissions
try {
  fs.chmodSync(uploadsDir, 0o755);
} catch (err) {
  console.warn('Could not set uploads directory permissions:', err);
}

// Allowed image extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const maxFileSize = 5 * 1024 * 1024; // 5MB

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`[MULTER] Setting destination for file: ${file.originalname}`);
    console.log(`[MULTER] User: ${req.user?.username}, Admin: ${req.user?.isAdmin}`);
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`[MULTER] Created uploads directory: ${uploadsDir}`);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate temporary filename using UUID (will be renamed after post creation)
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const tempFilename = `temp_${uuidv4()}${fileExtension}`;
    console.log(`[MULTER] Generated temp filename: ${tempFilename} for original: ${file.originalname}`);
    console.log(`[MULTER] User: ${req.user?.username}, Admin: ${req.user?.isAdmin}`);
    cb(null, tempFilename);
  }
});

// File filter to validate image types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log(`[FILEFILTER] Validating file: ${file.originalname}`);
  console.log(`[FILEFILTER] User: ${req.user?.username}, Admin: ${req.user?.isAdmin}`);
  console.log(`[FILEFILTER] MIME type: ${file.mimetype}`);
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    console.log(`[FILEFILTER] REJECTED - Invalid extension: ${fileExtension}`);
    return cb(new Error('Only image files (JPG, JPEG, PNG, GIF, WEBP) are allowed'));
  }
  
  // Check MIME type as additional security
  if (!file.mimetype.startsWith('image/')) {
    console.log(`[FILEFILTER] REJECTED - Invalid MIME type: ${file.mimetype}`);
    return cb(new Error('Only image files are allowed'));
  }
  
  console.log(`[FILEFILTER] ACCEPTED - File is valid`);
  cb(null, true);
};

const upload = multer({ 
  storage: storage_config,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 20
  }
});

// Add debugging middleware to log all file uploads
upload.array('images', 20).onError = (error: any, req: any, res: any, next: any) => {
  console.log('=== MULTER ERROR ===');
  console.log('Error:', error);
  console.log('User:', req.user?.username);
  console.log('Is Admin:', req.user?.isAdmin);
  next(error);
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Serve uploaded images
  app.use("/uploads", express.static(uploadsDir));

  // Dynamic meta tags for social sharing
  app.get("/meta-info", async (req, res) => {
    try {
      const recentPosts = await storage.getPosts();
      const recentAuthors = recentPosts.slice(0, 3).map(post => post.author.username);
      
      let dynamicDescription = "학원 홍보 및 정보 공유 플랫폼";
      let dynamicTitle = "학원광장 - 학원 홍보 플랫폼";
      
      if (recentAuthors.length > 0) {
        const authorsList = recentAuthors.join(", ");
        dynamicDescription = `${authorsList} 등의 홍보글이 있습니다 | 학원 홍보 및 정보 공유 플랫폼`;
        dynamicTitle = `${authorsList} 등의 홍보글 | 학원광장`;
      }
      
      res.json({
        title: dynamicTitle,
        description: dynamicDescription,
        authors: recentAuthors
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meta info" });
    }
  });

  // Get posts with optional filters
  app.get("/api/posts", async (req, res) => {
    try {
      const { region, subject, targetGrade } = req.query;
      const filters = {
        region: region as string,
        subject: subject as string,
        targetGrade: targetGrade as string
      };
      
      // Remove undefined values
      Object.keys(filters).forEach(key => 
        filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]
      );

      const posts = await storage.getPosts(Object.keys(filters).length > 0 ? filters : undefined);
      
      // Validate that image files still exist
      const validatedPosts = posts.map(post => ({
        ...post,
        imageUrls: post.imageUrls?.filter(url => {
          const filename = url.replace('/uploads/', '');
          return filePersistence.verifyFile(filename);
        }) || []
      }));
      
      res.json(validatedPosts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Create new post (requires authentication and approval)
  app.post("/api/posts", (req, res, next) => {
    console.log("=== POST REQUEST RECEIVED ===");
    console.log("User authenticated:", req.isAuthenticated());
    console.log("User:", req.user?.username);
    console.log("User is admin:", req.user?.isAdmin);
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.status !== "approved") {
      return res.status(403).json({ message: "Account not approved" });
    }

    // Apply multer middleware after authentication check
    upload.array("images", 20)(req, res, (err) => {
      if (err) {
        console.error("=== MULTER ERROR ===");
        console.error("Error:", err);
        console.error("User:", req.user?.username);
        console.error("Is Admin:", req.user?.isAdmin);
        return res.status(400).json({ message: err.message });
      }
      
      console.log("Multer processing complete");
      console.log("Files received:", req.files?.length || 0);
      next();
    });
  }, async (req, res) => {

    try {
      const postData = insertPostSchema.parse(req.body);
      const files = req.files as Express.Multer.File[];
      
      console.log("Post data:", postData);
      console.log("Files array:", files?.map(f => ({ filename: f.filename, originalname: f.originalname, size: f.size })));
      
      // Process image URLs BEFORE creating the post
      const imageUrls: string[] = [];
      
      if (files && files.length > 0) {
        // Create post first to get ID
        const tempPost = await storage.createPost({
          ...postData,
          imageUrls: [],
          authorId: req.user.id
        });
        
        console.log(`Created post ${tempPost.id}, now processing ${files.length} files`);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const tempFilePath = path.join(uploadsDir, file.filename);
          
          console.log(`Processing file ${i + 1}/${files.length}: ${file.filename}`);
          console.log(`Temp file path: ${tempFilePath}`);
          console.log(`Temp file exists: ${fs.existsSync(tempFilePath)}`);
          
          if (fs.existsSync(tempFilePath)) {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            const finalFilename = `post${tempPost.id}_${i + 1}_${uuidv4()}${fileExtension}`;
            const finalFilePath = path.join(uploadsDir, finalFilename);
            
            try {
              // Use copyFile + unlink instead of rename for better reliability
              fs.copyFileSync(tempFilePath, finalFilePath);
              
              // Verify the file was copied successfully
              if (fs.existsSync(finalFilePath)) {
                // Set proper permissions on the copied file
                fs.chmodSync(finalFilePath, 0o644);
                fs.unlinkSync(tempFilePath);
                imageUrls.push(`/uploads/${finalFilename}`);
                console.log(`✓ Successfully saved: ${finalFilename} (size: ${fs.statSync(finalFilePath).size} bytes)`);
                
                // Verify with persistence manager
                if (filePersistence.verifyFile(finalFilename)) {
                  console.log(`✓ File persistence verified: ${finalFilename}`);
                } else {
                  console.warn(`⚠ File persistence verification failed: ${finalFilename}`);
                }
              } else {
                console.error(`✗ File copy failed - destination file not found: ${finalFilePath}`);
              }
            } catch (fileError) {
              console.error(`✗ Failed to process file ${file.filename}:`, fileError);
              // Try to clean up temp file if it exists
              if (fs.existsSync(tempFilePath)) {
                try {
                  fs.unlinkSync(tempFilePath);
                } catch (cleanupError) {
                  console.error(`✗ Failed to clean up temp file: ${cleanupError}`);
                }
              }
            }
          } else {
            console.error(`✗ Temp file not found: ${tempFilePath}`);
            // List all files in uploads directory for debugging
            const allFiles = fs.readdirSync(uploadsDir);
            console.log(`Available files in uploads:`, allFiles);
          }
        }
        
        // Update post with final image URLs
        if (imageUrls.length > 0) {
          console.log(`Updating post ${tempPost.id} with ${imageUrls.length} image URLs:`, imageUrls);
          await storage.updatePost(tempPost.id, { imageUrls });
          tempPost.imageUrls = imageUrls;
        } else {
          console.log(`⚠️ No images saved for post ${tempPost.id}`);
        }
        
        console.log("=== POST CREATION COMPLETE ===");
        res.status(201).json(tempPost);
      } else {
        // No files, create post without images
        const post = await storage.createPost({
          ...postData,
          imageUrls: [],
          authorId: req.user.id
        });
        
        console.log("Created post without images:", post.id);
        res.status(201).json(post);
      }
    } catch (error) {
      console.error("=== POST CREATION ERROR ===");
      console.error("Error details:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid post data" });
    }
  });

  // Admin routes
  app.get("/api/admin/pending-users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const pendingUsers = await storage.getPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/admin/approve-user/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.id);
      const { status } = req.body; // "approved" or "rejected"
      
      await storage.updateUserStatus(userId, status);
      res.json({ message: `User ${status}` });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Update post (only author or admin)
  app.put("/api/posts/:id", (req, res, next) => {
    upload.array("images", 20)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: "File size too large. Maximum 5MB per file." });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ message: "Too many files. Maximum 20 files allowed." });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const postId = parseInt(req.params.id);
      const posts = await storage.getPosts();
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const postData = insertPostSchema.parse(req.body);
      const files = req.files as Express.Multer.File[];
      
      let imageUrls = post.imageUrls; // Keep existing images by default
      
      // If new files uploaded, verify and add them
      if (files && files.length > 0) {
        const newImageUrls: string[] = [];
        for (const file of files) {
          const filePath = path.join(uploadsDir, file.filename);
          if (fs.existsSync(filePath)) {
            newImageUrls.push(`/uploads/${file.filename}`);
          }
        }
        imageUrls = newImageUrls;
      }
      
      await storage.updatePost(postId, {
        ...postData,
        imageUrls
      });

      res.json({ message: "Post updated" });
    } catch (error) {
      console.error("Post update error:", error);
      res.status(400).json({ message: "Failed to update post" });
    }
  });

  // Delete post (only author or admin)
  app.delete("/api/posts/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const postId = parseInt(req.params.id);
      const posts = await storage.getPosts();
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Delete associated images before deleting the post
      if (post.imageUrls && post.imageUrls.length > 0) {
        for (const imageUrl of post.imageUrls) {
          try {
            // Extract filename from URL (e.g., "/uploads/post1_1_uuid.jpg" -> "post1_1_uuid.jpg")
            const filename = imageUrl.replace('/uploads/', '');
            const filePath = path.join(uploadsDir, filename);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted image file: ${filename}`);
            }
          } catch (fileError) {
            console.error(`Failed to delete image file ${imageUrl}:`, fileError);
            // Continue with other files even if one fails
          }
        }
      }

      await storage.deletePost(postId);
      res.json({ message: "Post deleted" });
    } catch (error) {
      console.error("Post deletion error:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getComments(postId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const commentData = insertCommentSchema.parse(req.body);
      
      const comment = await storage.createComment({
        content: commentData.content,
        authorName: commentData.authorName,
        authorPassword: commentData.authorPassword,
        postId: postId
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Comment creation error:", error);
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const deleted = await storage.deleteComment(commentId, password);
      
      if (!deleted) {
        return res.status(403).json({ message: "Invalid password or comment not found" });
      }
      
      res.json({ message: "Comment deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Allow post authors to delete comments
  app.delete("/api/posts/:postId/comments/:commentId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const postId = parseInt(req.params.postId);
      const commentId = parseInt(req.params.commentId);
      
      // Check if user is the post author
      const posts = await storage.getPosts();
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Only post authors and admins can delete comments" });
      }

      // Force delete comment (bypass password check)
      const comments = await storage.getComments(postId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      await storage.deleteComment(commentId, comment.authorPassword);
      res.json({ message: "Comment deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Like/Unlike routes
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userIp = req.ip || req.connection.remoteAddress || "unknown";
      
      const hasLiked = await storage.hasUserLiked(postId, userIp);
      
      if (hasLiked) {
        await storage.unlikePost(postId, userIp);
        res.json({ message: "Post unliked", liked: false });
      } else {
        await storage.likePost(postId, userIp);
        res.json({ message: "Post liked", liked: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  });

  app.get("/api/posts/:id/like-status", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userIp = req.ip || req.connection.remoteAddress || "unknown";
      
      const hasLiked = await storage.hasUserLiked(postId, userIp);
      res.json({ liked: hasLiked });
    } catch (error) {
      res.status(500).json({ message: "Failed to get like status" });
    }
  });

  // User management routes
  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/banned-users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const bannedUsers = await storage.getBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch banned users" });
    }
  });

  app.post("/api/admin/ban-user/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.id);
      const { reason } = req.body;
      
      await storage.banUser(userId, req.user.id, reason || "관리자에 의한 강퇴");
      res.json({ message: "User banned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.post("/api/admin/unban-user/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const userId = parseInt(req.params.id);
      await storage.unbanUser(userId);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  app.delete("/api/admin/posts/:id", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const postId = parseInt(req.params.id);
      const posts = await storage.getPosts();
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Delete associated images before deleting the post
      if (post.imageUrls && post.imageUrls.length > 0) {
        for (const imageUrl of post.imageUrls) {
          try {
            // Extract filename from URL (e.g., "/uploads/post1_1_uuid.jpg" -> "post1_1_uuid.jpg")
            const filename = imageUrl.replace('/uploads/', '');
            const filePath = path.join(uploadsDir, filename);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Admin deleted image file: ${filename}`);
            }
          } catch (fileError) {
            console.error(`Failed to delete image file ${imageUrl}:`, fileError);
            // Continue with other files even if one fails
          }
        }
      }

      await storage.deletePost(postId);
      res.json({ message: "Post deleted" });
    } catch (error) {
      console.error("Admin post deletion error:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Create default admin user if not exists
  (async () => {
    try {
      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        const { hashPassword } = await import("./auth");
        await storage.createUser({
          username: "admin",
          password: await hashPassword("admin123!"),
          phone: "010-0000-0000",
          isAdmin: true,
          status: "approved"
        });
        console.log("Default admin user created: admin / admin123!");
      }
    } catch (error) {
      console.error("Failed to create default admin user:", error);
    }
  })();

  const httpServer = createServer(app);
  return httpServer;
}
