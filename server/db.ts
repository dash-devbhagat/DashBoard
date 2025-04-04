import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// For production environments
let connectionString = process.env.DATABASE_URL;

// For local development, construct the connection string from individual environment variables
if (!connectionString) {
  const PGHOST = process.env.PGHOST || 'localhost';
  const PGPORT = process.env.PGPORT || '5432';
  const PGUSER = process.env.PGUSER || 'postgres';
  const PGPASSWORD = process.env.PGPASSWORD || 'password';
  const PGDATABASE = process.env.PGDATABASE || 'postgres';
  
  connectionString = `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
}

// Create postgres client
const client = postgres(connectionString, { max: 1 });

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export a function to migrate the database
export async function migrate() {
  console.log('Starting database migration...');
  
  try {
    // Simple migration by executing the SQL file directly
    // Note: This is a simplified approach. In a production app, you would use drizzle-kit migrate
    const migrationPath = resolve('./migrations/0000_first_migration.sql');
    try {
      const migrationSQL = readFileSync(migrationPath, 'utf8');
      await client.unsafe(migrationSQL);
      console.log('Migration successful');
    } catch (readError) {
      console.error('Migration file not found, skipping migration:', readError);
    }
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Export a function to seed the database with initial data
export async function seed() {
  const { teamMembers, projects, tasks, allocations, timelinePhases } = schema;
  
  console.log('Seeding database with initial data...');
  
  try {
    // Clear the existing data if needed (but keep foreign key constraints)
    // This is done to ensure a fresh start without conflicts
    try {
      await db.delete(timelinePhases);
      await db.delete(allocations);
      await db.delete(tasks);
      await db.delete(projects);
      await db.delete(teamMembers);
    } catch (deleteError) {
      console.log('Error clearing existing data (continuing anyway):', deleteError);
    }

    // 1. First insert team members
    console.log('Seeding team members...');
    await db.insert(teamMembers).values([
      { name: "Sarah Johnson", role: "UI Designer", avatar: "https://randomuser.me/api/portraits/women/44.jpg", availability: 60 },
      { name: "Michael Chen", role: "Full Stack Developer", avatar: "https://randomuser.me/api/portraits/men/32.jpg", availability: 20 },
      { name: "Emily Wilson", role: "UX Researcher", avatar: "https://randomuser.me/api/portraits/women/68.jpg", availability: 85 },
      { name: "Daniel Brown", role: "Backend Developer", avatar: "https://randomuser.me/api/portraits/men/75.jpg", availability: 40 },
      { name: "Olivia Taylor", role: "Project Manager", avatar: "https://randomuser.me/api/portraits/women/24.jpg", availability: 30 },
      { name: "James Anderson", role: "Full Stack Developer", avatar: "https://randomuser.me/api/portraits/men/41.jpg", availability: 70 },
      { name: "Sophia Martinez", role: "UI Designer", avatar: "https://randomuser.me/api/portraits/women/32.jpg", availability: 55 },
      { name: "Ethan Wilson", role: "Backend Developer", avatar: "https://randomuser.me/api/portraits/men/54.jpg", availability: 25 }
    ]).onConflictDoNothing();
    
    // 2. Then insert projects
    console.log('Seeding projects...');
    const projectValues = [
      { 
        id: 1, // Explicitly set IDs to ensure consistency
        name: "E-commerce Redesign", 
        status: "active", 
        startDate: "2023-06-01", 
        endDate: "2023-12-15", 
        description: "Redesign the user interface and improve UX for the e-commerce platform", 
        color: "#4361ee" 
      },
      { 
        id: 2,
        name: "API Integration", 
        status: "active", 
        startDate: "2023-07-15", 
        endDate: "2023-10-30", 
        description: "Integrate third-party APIs for payment processing and shipping", 
        color: "#3a86ff" 
      },
      { 
        id: 3,
        name: "Mobile App Development", 
        status: "active", 
        startDate: "2023-08-01", 
        endDate: "2024-01-31", 
        description: "Develop a native mobile app for iOS and Android", 
        color: "#7209b7" 
      },
      { 
        id: 4,
        name: "Database Migration", 
        status: "pending", 
        startDate: "2023-11-01", 
        endDate: "2024-02-28", 
        description: "Migrate from SQL to NoSQL database for better scalability", 
        color: "#f72585" 
      },
      { 
        id: 5,
        name: "DevOps Implementation", 
        status: "active", 
        startDate: "2023-09-01", 
        endDate: "2024-03-31", 
        description: "Implement CI/CD pipeline and containerization", 
        color: "#4cc9f0" 
      },
      { 
        id: 6,
        name: "Security Audit", 
        status: "completed", 
        startDate: "2023-05-01", 
        endDate: "2023-07-31", 
        description: "Conduct security audit and implement recommendations", 
        color: "#560bad" 
      }
    ];
    
    for (const project of projectValues) {
      await db.insert(projects).values(project).onConflictDoNothing();
    }
    
    // Get the inserted projects to confirm they exist
    const insertedProjects = await db.select().from(projects);
    console.log(`Inserted ${insertedProjects.length} projects`);
    
    // 3. Now we can insert tasks that reference these projects
    console.log('Seeding tasks...');
    
    // First get the inserted team members to ensure we use valid IDs
    const insertedTeamMembers = await db.select().from(teamMembers);
    console.log(`Found ${insertedTeamMembers.length} team members for task assignment`);
    
    // Only proceed if we have team members to assign
    if (insertedTeamMembers.length > 0) {
      // Use the actual IDs from the database
      const taskValues = [
        { 
          title: "UI Component Library", 
          description: "Create a reusable component library for the e-commerce platform", 
          priority: "high", 
          status: "in-progress", 
          estimatedHours: 40, 
          dueDate: "2023-08-15", 
          category: "frontend", 
          projectId: 1, 
          assigneeId: insertedTeamMembers[0]?.id || null // UI Designer
        },
        { 
          title: "Database Schema Design", 
          description: "Design the database schema for the new NoSQL structure", 
          priority: "medium", 
          status: "not-started", 
          estimatedHours: 20, 
          dueDate: "2023-11-15", 
          category: "backend", 
          projectId: 4, 
          assigneeId: insertedTeamMembers[3]?.id || null // Backend Developer
        },
        { 
          title: "API Authentication Flow", 
          description: "Implement OAuth 2.0 for the API integration project", 
          priority: "high", 
          status: "not-started", 
          estimatedHours: 15, 
          dueDate: "2023-08-30", 
          category: "backend", 
          projectId: 2, 
          assigneeId: null 
        },
        { 
          title: "Mobile Navigation Design", 
          description: "Design the navigation structure for the mobile app", 
          priority: "medium", 
          status: "in-progress", 
          estimatedHours: 25, 
          dueDate: "2023-09-15", 
          category: "design", 
          projectId: 3, 
          assigneeId: insertedTeamMembers[2]?.id || null // UX Researcher
        },
        { 
          title: "CI Pipeline Setup", 
          description: "Configure Jenkins for continuous integration", 
          priority: "low", 
          status: "completed", 
          estimatedHours: 30, 
          dueDate: "2023-10-01", 
          category: "devops", 
          projectId: 5, 
          assigneeId: insertedTeamMembers[5]?.id || null // Full Stack Developer
        },
        { 
          title: "Payment Gateway Integration", 
          description: "Integrate Stripe and PayPal payment gateways", 
          priority: "high", 
          status: "not-started", 
          estimatedHours: 35, 
          dueDate: "2023-09-30", 
          category: "backend", 
          projectId: 2, 
          assigneeId: null 
        },
        { 
          title: "User Testing Coordination", 
          description: "Coordinate user testing sessions for the e-commerce redesign", 
          priority: "medium", 
          status: "not-started", 
          estimatedHours: 20, 
          dueDate: "2023-10-15", 
          category: "ux", 
          projectId: 1, 
          assigneeId: null 
        }
      ];
      
      for (const task of taskValues) {
        await db.insert(tasks).values(task).onConflictDoNothing();
      }
    } else {
      console.warn('No team members found for task assignment, skipping task assignment');
    }
    
    // 4. Insert allocations
    console.log('Seeding allocations...');
    
    // Only proceed if we have team members for allocations
    if (insertedTeamMembers.length > 0) {
      const allocationValues = [
        { 
          teamMemberId: insertedTeamMembers[0]?.id, 
          projectId: 1, 
          percentage: 60, 
          startDate: "2023-06-01", 
          endDate: "2023-09-30" 
        },
        { 
          teamMemberId: insertedTeamMembers[1]?.id, 
          projectId: 2, 
          percentage: 80, 
          startDate: "2023-07-15", 
          endDate: "2023-10-30" 
        },
        { 
          teamMemberId: insertedTeamMembers[2]?.id, 
          projectId: 3, 
          percentage: 40, 
          startDate: "2023-08-01", 
          endDate: "2023-12-31" 
        },
        { 
          teamMemberId: insertedTeamMembers[3]?.id, 
          projectId: 4, 
          percentage: 60, 
          startDate: "2023-11-01", 
          endDate: "2024-01-31" 
        },
        { 
          teamMemberId: insertedTeamMembers[4]?.id, 
          projectId: 1, 
          percentage: 30, 
          startDate: "2023-06-01", 
          endDate: "2023-12-15" 
        },
        { 
          teamMemberId: insertedTeamMembers[4]?.id, 
          projectId: 3, 
          percentage: 40, 
          startDate: "2023-08-01", 
          endDate: "2024-01-31" 
        },
        { 
          teamMemberId: insertedTeamMembers[5]?.id, 
          projectId: 5, 
          percentage: 70, 
          startDate: "2023-09-01", 
          endDate: "2023-12-31" 
        },
        { 
          teamMemberId: insertedTeamMembers[6]?.id, 
          projectId: 1, 
          percentage: 45, 
          startDate: "2023-07-01", 
          endDate: "2023-10-31" 
        },
        { 
          teamMemberId: insertedTeamMembers[7]?.id || insertedTeamMembers[0]?.id, 
          projectId: 2, 
          percentage: 75, 
          startDate: "2023-08-01", 
          endDate: "2023-10-30" 
        }
      ].filter(allocation => allocation.teamMemberId !== undefined);
      
      for (const allocation of allocationValues) {
        await db.insert(allocations).values(allocation).onConflictDoNothing();
      }
    } else {
      console.warn('No team members found for allocations, skipping allocation assignment');
    }
    
    // 5. Insert timeline phases
    console.log('Seeding timeline phases...');
    const phaseValues = [
      { projectId: 1, name: "Planning", startWeek: 1, durationWeeks: 3, color: "#4361ee" },
      { projectId: 1, name: "Design", startWeek: 4, durationWeeks: 6, color: "#3a0ca3" },
      { projectId: 1, name: "Development", startWeek: 10, durationWeeks: 12, color: "#7209b7" },
      { projectId: 1, name: "Testing", startWeek: 22, durationWeeks: 4, color: "#f72585" },
      { projectId: 2, name: "Planning", startWeek: 1, durationWeeks: 2, color: "#4361ee" },
      { projectId: 2, name: "Development", startWeek: 3, durationWeeks: 8, color: "#7209b7" },
      { projectId: 2, name: "Testing", startWeek: 11, durationWeeks: 5, color: "#f72585" },
      { projectId: 3, name: "Design", startWeek: 1, durationWeeks: 6, color: "#3a0ca3" },
      { projectId: 3, name: "Development", startWeek: 7, durationWeeks: 16, color: "#7209b7" },
      { projectId: 3, name: "Testing", startWeek: 23, durationWeeks: 4, color: "#f72585" }
    ];
    
    for (const phase of phaseValues) {
      await db.insert(timelinePhases).values(phase).onConflictDoNothing();
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}