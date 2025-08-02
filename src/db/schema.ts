import { pgTable, serial, text, timestamp, integer, boolean, jsonb, uuid, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  userId: integer('user_id').notNull().references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const vectors = pgTable('vectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  name: varchar('name', { length: 255 }).notNull(),
  dimension: integer('dimension').notNull(),
  embedding: jsonb('embedding').notNull(), // In production, consider using pgvector extension
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  vectors: many(vectors),
}));

export const vectorsRelations = relations(vectors, ({ one }) => ({
  project: one(projects, {
    fields: [vectors.projectId],
    references: [projects.id],
  }),
}));