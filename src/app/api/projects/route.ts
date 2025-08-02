import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/projects - Get all projects with user information
export async function GET() {
  try {
    const allProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        isActive: projects.isActive,
        metadata: projects.metadata,
        createdAt: projects.createdAt,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(projects)
      .leftJoin(users, eq(projects.userId, users.id));

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, userId, metadata } = body;

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      );
    }

    // Check if userId exists
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'Provided userId does not exist' },
        { status: 400 }
      );
    }

    const newProject = await db
      .insert(projects)
      .values({
        name,
        description,
        userId,
        metadata,
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}