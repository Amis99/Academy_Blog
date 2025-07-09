import { users, posts, type User, type InsertUser, type Post, type InsertPost, type PostWithAuthor } from "@shared/schema";
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
  
  createPost(post: InsertPost & { authorId: number }): Promise<Post>;
  getPosts(filters?: { region?: string; subject?: string; targetGrade?: string }): Promise<PostWithAuthor[]>;
  deletePost(id: number): Promise<void>;
  
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
        query = query.where(and(...conditions));
      }
    }

    const results = await query;
    return results.map(result => ({
      ...result.posts,
      author: result.users!
    }));
  }

  async deletePost(id: number): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }
}

export const storage = new DatabaseStorage();
