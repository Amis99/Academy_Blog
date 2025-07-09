import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertPostSchema } from "@shared/schema";
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
  app.post("/api/posts", upload.single("image"), async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.status !== "approved") {
      return res.status(403).json({ message: "Account not approved" });
    }

    try {
      const postData = insertPostSchema.parse(req.body);
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
      
      const post = await storage.createPost({
        ...postData,
        imageUrl,
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
