import { users, posts, comments, likes, type User, type InsertUser, type Post, type InsertPost, type PostWithAuthor, type Comment, type InsertComment, type Like } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, sql, gte } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import fs from 'fs';
import path from 'path';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: string): Promise<void>;
  getPendingUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getBannedUsers(): Promise<User[]>;
  banUser(id: number, adminId: number, reason: string): Promise<void>;
  unbanUser(id: number): Promise<void>;
  
  createPost(post: InsertPost & { authorId: number }): Promise<Post>;
  getPosts(filters?: { region?: string; subject?: string; targetGrade?: string }): Promise<PostWithAuthor[]>;
  updatePost(id: number, post: Partial<InsertPost>): Promise<void>;
  deletePost(id: number): Promise<void>;
  deleteOldPosts(): Promise<number>;
  
  createComment(comment: { content: string; authorName: string; authorPassword: string; postId: number }): Promise<Comment>;
  getComments(postId: number): Promise<Comment[]>;
  deleteComment(id: number, password: string): Promise<boolean>;
  verifyCommentPassword(id: number, password: string): Promise<boolean>;
  
  likePost(postId: number, userIp: string): Promise<void>;
  unlikePost(postId: number, userIp: string): Promise<void>;
  hasUserLiked(postId: number, userIp: string): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean; status?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStatus(id: number, status: string): Promise<void> {
    await db.update(users).set({ status }).where(eq(users.id, id));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, "pending"));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getBannedUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.status, "banned"));
  }

  async banUser(id: number, adminId: number, reason: string): Promise<void> {
    await db.update(users).set({ 
      status: "banned", 
      bannedAt: new Date(),
      bannedBy: adminId,
      banReason: reason
    }).where(eq(users.id, id));
  }

  async unbanUser(id: number): Promise<void> {
    await db.update(users).set({ 
      status: "approved", 
      bannedAt: null,
      bannedBy: null,
      banReason: null
    }).where(eq(users.id, id));
  }

  async createPost(post: InsertPost & { authorId: number }): Promise<Post> {
    const [newPost] = await db
      .insert(posts)
      .values(post)
      .returning();
    return newPost;
  }

  async getPosts(filters?: { region?: string; subject?: string; targetGrade?: string }): Promise<PostWithAuthor[]> {
    // Calculate date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    let query = db.select().from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(gte(posts.createdAt, threeDaysAgo))
      .orderBy(desc(posts.createdAt));

    if (filters) {
      const conditions = [gte(posts.createdAt, threeDaysAgo)];
      if (filters.region) conditions.push(eq(posts.region, filters.region));
      if (filters.subject) conditions.push(eq(posts.subject, filters.subject));
      if (filters.targetGrade) conditions.push(eq(posts.targetGrade, filters.targetGrade));
      
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;
    return results.map(result => ({
      ...result.posts,
      author: result.users!
    }));
  }

  async updatePost(id: number, post: Partial<InsertPost>): Promise<void> {
    await db.update(posts).set(post).where(eq(posts.id, id));
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async deleteOldPosts(): Promise<number> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // Get old posts with their image URLs before deleting
    const oldPosts = await db.select()
      .from(posts)
      .where(sql`${posts.createdAt} < ${threeDaysAgo}`);
    
    // Delete associated image files
    for (const post of oldPosts) {
      if (post.imageUrls && post.imageUrls.length > 0) {
        post.imageUrls.forEach(imageUrl => {
          const filename = imageUrl.replace('/uploads/', '');
          const filepath = path.join(process.cwd(), 'uploads', filename);
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        });
      }
    }
    
    const deletedPosts = await db.delete(posts)
      .where(sql`${posts.createdAt} < ${threeDaysAgo}`)
      .returning();
    
    return deletedPosts.length;
  }

  async createComment(comment: { content: string; authorName: string; authorPassword: string; postId: number }): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getComments(postId: number): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
  }

  async deleteComment(id: number, password: string): Promise<boolean> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!comment) return false;
    
    // Verify password before deleting
    if (comment.authorPassword !== password) return false;
    
    await db.delete(comments).where(eq(comments.id, id));
    return true;
  }

  async verifyCommentPassword(id: number, password: string): Promise<boolean> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    if (!comment) return false;
    
    return comment.authorPassword === password;
  }

  async likePost(postId: number, userIp: string): Promise<void> {
    // Check if user already liked this post
    const existingLike = await db.select().from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userIp, userIp)))
      .limit(1);
    
    if (existingLike.length === 0) {
      // Add like
      await db.insert(likes).values({ postId, userIp });
      
      // Increment likes count in posts table
      await db.update(posts)
        .set({ likesCount: sql`likes_count + 1` })
        .where(eq(posts.id, postId));
    }
  }

  async unlikePost(postId: number, userIp: string): Promise<void> {
    // Remove like
    const deletedLikes = await db.delete(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userIp, userIp)))
      .returning();
    
    if (deletedLikes.length > 0) {
      // Decrement likes count in posts table
      await db.update(posts)
        .set({ likesCount: sql`likes_count - 1` })
        .where(eq(posts.id, postId));
    }
  }

  async hasUserLiked(postId: number, userIp: string): Promise<boolean> {
    const existingLike = await db.select().from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userIp, userIp)))
      .limit(1);
    
    return existingLike.length > 0;
  }
}

export const storage = new DatabaseStorage();
