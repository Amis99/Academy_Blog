import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_config });

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Serve uploaded images
  app.use("/uploads", express.static(uploadsDir));

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
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Create new post (requires authentication and approval)
  app.post("/api/posts", upload.array("images", 20), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.status !== "approved") {
      return res.status(403).json({ message: "Account not approved" });
    }

    try {
      const postData = insertPostSchema.parse(req.body);
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];
      
      const post = await storage.createPost({
        ...postData,
        imageUrls,
        authorId: req.user.id
      });

      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid post data" });
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
  app.put("/api/posts/:id", upload.array("images", 20), async (req, res) => {
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
      const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : post.imageUrls;
      
      await storage.updatePost(postId, {
        ...postData,
        imageUrls
      });

      res.json({ message: "Post updated" });
    } catch (error) {
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

      await storage.deletePost(postId);
      res.json({ message: "Post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Delete old posts (admin only)
  app.delete("/api/posts/cleanup/old", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const deletedCount = await storage.deleteOldPosts();
      res.json({ message: `Deleted ${deletedCount} old posts` });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete old posts" });
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
      await storage.deletePost(postId);
      res.json({ message: "Post deleted" });
    } catch (error) {
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
