import { users, posts, comments, type User, type InsertUser, type Post, type InsertPost, type PostWithAuthor, type Comment, type InsertComment } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  
  createComment(comment: { content: string; authorName: string; authorPassword: string; postId: number }): Promise<Comment>;
  getComments(postId: number): Promise<Comment[]>;
  deleteComment(id: number, password: string): Promise<boolean>;
  verifyCommentPassword(id: number, password: string): Promise<boolean>;
  
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
    let query = db.select().from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(posts.createdAt));

    if (filters) {
      const conditions = [];
      if (filters.region) conditions.push(eq(posts.region, filters.region));
      if (filters.subject) conditions.push(eq(posts.subject, filters.subject));
      if (filters.targetGrade) conditions.push(eq(posts.targetGrade, filters.targetGrade));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
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
}

export const storage = new DatabaseStorage();
