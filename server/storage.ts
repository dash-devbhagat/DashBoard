import {
  teamMembers, projects, allocations, timelinePhases, projectStatus,
  type TeamMember, type InsertTeamMember,
  type Project, type InsertProject,
  type Allocation, type InsertAllocation,
  type TimelinePhase, type InsertTimelinePhase,
  type ProjectStatus, type InsertProjectStatus,
  type TeamPerformance, type CategoryHours
} from "@shared/schema";
import { db } from "./db";
import { eq, isNull, sql, count } from "drizzle-orm";

export interface IStorage {
  // Team Members
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamMember(id: number): Promise<TeamMember | undefined>;
  createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, teamMember: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Allocations
  getAllocations(): Promise<Allocation[]>;
  getAllocation(id: number): Promise<Allocation | undefined>;
  getAllocationsByTeamMember(teamMemberId: number): Promise<Allocation[]>;
  getAllocationsByProject(projectId: number): Promise<Allocation[]>;
  createAllocation(allocation: InsertAllocation): Promise<Allocation>;
  updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined>;
  deleteAllocation(id: number): Promise<boolean>;

  // Timeline Phases
  getTimelinePhases(): Promise<TimelinePhase[]>;
  getTimelinePhasesByProject(projectId: number): Promise<TimelinePhase[]>;
  createTimelinePhase(phase: InsertTimelinePhase): Promise<TimelinePhase>;
  updateTimelinePhase(id: number, phase: Partial<InsertTimelinePhase>): Promise<TimelinePhase | undefined>;
  deleteTimelinePhase(id: number): Promise<boolean>;

  // Project Status
  getProjectStatuses(): Promise<ProjectStatus[]>;
  getProjectStatusesByProject(projectId: number): Promise<ProjectStatus[]>;
  getProjectStatusByWeek(projectId: number, weekEndDate: string): Promise<ProjectStatus | undefined>;
  createProjectStatus(status: InsertProjectStatus): Promise<ProjectStatus>;
  updateProjectStatus(id: number, status: Partial<InsertProjectStatus>): Promise<ProjectStatus | undefined>;
  deleteProjectStatus(id: number): Promise<boolean>;
  
  // Dashboard Stats
  getDashboardStats(): Promise<DashboardStats>;
  getTeamUtilization(): Promise<TeamUtilization[]>;
  getTeamPerformance(): Promise<TeamPerformance[]>;
  getCategoryHours(): Promise<CategoryHours[]>;
}

export type DashboardStats = {
  activeProjects: number;
  teamUtilizationAvg: number;
  zeroAllocationCount: number;
  partiallyAllocatedCount: number;
  fullyAllocatedCount: number;
};

export type TeamUtilization = {
  role: string;
  memberCount: number;
  utilizationPercentage: number;
};

export class MemStorage implements IStorage {
  private teamMembers: Map<number, TeamMember>;
  private projects: Map<number, Project>;
  private allocations: Map<number, Allocation>;
  private timelinePhases: Map<number, TimelinePhase>;
  private projectStatuses: Map<number, ProjectStatus>;
  
  private teamMembersId: number;
  private projectsId: number;
  private allocationsId: number;
  private timelinePhasesId: number;
  private projectStatusesId: number;

  constructor() {
    this.teamMembers = new Map();
    this.projects = new Map();
    this.allocations = new Map();
    this.timelinePhases = new Map();
    this.projectStatuses = new Map();

    this.teamMembersId = 1;
    this.projectsId = 1;
    this.allocationsId = 1;
    this.timelinePhasesId = 1;
    this.projectStatusesId = 1;

    this.seedData();
  }

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values());
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const id = this.teamMembersId++;
    const newTeamMember = { ...teamMember, id };
    this.teamMembers.set(id, newTeamMember);
    return newTeamMember;
  }

  async updateTeamMember(id: number, teamMember: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const existingTeamMember = this.teamMembers.get(id);
    if (!existingTeamMember) return undefined;

    const updatedTeamMember = { ...existingTeamMember, ...teamMember };
    this.teamMembers.set(id, updatedTeamMember);
    return updatedTeamMember;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    return this.teamMembers.delete(id);
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectsId++;
    const newProject = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;

    const updatedProject = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Tasks section removed

  // Allocations
  async getAllocations(): Promise<Allocation[]> {
    return Array.from(this.allocations.values());
  }

  async getAllocation(id: number): Promise<Allocation | undefined> {
    return this.allocations.get(id);
  }

  async getAllocationsByTeamMember(teamMemberId: number): Promise<Allocation[]> {
    return Array.from(this.allocations.values()).filter(
      allocation => allocation.teamMemberId === teamMemberId
    );
  }

  async getAllocationsByProject(projectId: number): Promise<Allocation[]> {
    return Array.from(this.allocations.values()).filter(
      allocation => allocation.projectId === projectId
    );
  }

  async createAllocation(allocation: InsertAllocation): Promise<Allocation> {
    const id = this.allocationsId++;
    const newAllocation = { ...allocation, id };
    this.allocations.set(id, newAllocation);
    return newAllocation;
  }

  async updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined> {
    const existingAllocation = this.allocations.get(id);
    if (!existingAllocation) return undefined;

    const updatedAllocation = { ...existingAllocation, ...allocation };
    this.allocations.set(id, updatedAllocation);
    return updatedAllocation;
  }

  async deleteAllocation(id: number): Promise<boolean> {
    return this.allocations.delete(id);
  }

  // Timeline Phases
  async getTimelinePhases(): Promise<TimelinePhase[]> {
    return Array.from(this.timelinePhases.values());
  }

  async getTimelinePhasesByProject(projectId: number): Promise<TimelinePhase[]> {
    return Array.from(this.timelinePhases.values()).filter(
      phase => phase.projectId === projectId
    );
  }

  async createTimelinePhase(phase: InsertTimelinePhase): Promise<TimelinePhase> {
    const id = this.timelinePhasesId++;
    const newPhase = { ...phase, id };
    this.timelinePhases.set(id, newPhase);
    return newPhase;
  }

  async updateTimelinePhase(id: number, phase: Partial<InsertTimelinePhase>): Promise<TimelinePhase | undefined> {
    const existingPhase = this.timelinePhases.get(id);
    if (!existingPhase) return undefined;

    const updatedPhase = { ...existingPhase, ...phase };
    this.timelinePhases.set(id, updatedPhase);
    return updatedPhase;
  }

  async deleteTimelinePhase(id: number): Promise<boolean> {
    return this.timelinePhases.delete(id);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const activeProjects = Array.from(this.projects.values()).filter(
      project => project.status === 'active'
    ).length;

    let totalUtilization = 0;
    const teamMembers = Array.from(this.teamMembers.values());
    
    // Team member allocation stats
    let zeroAllocationCount = 0;
    let partiallyAllocatedCount = 0;
    let fullyAllocatedCount = 0;
    
    teamMembers.forEach(member => {
      const memberAllocations = Array.from(this.allocations.values()).filter(
        allocation => allocation.teamMemberId === member.id
      );
      const utilizationSum = memberAllocations.reduce(
        (sum, allocation) => sum + allocation.percentage, 
        0
      );
      
      totalUtilization += utilizationSum;
      
      // Track different allocation categories
      if (utilizationSum >= 100) {
        fullyAllocatedCount++;
      } else if (utilizationSum >= 75) {
        partiallyAllocatedCount++;
      } else {
        if (utilizationSum === 0) { zeroAllocationCount++; } else { partiallyAllocatedCount++; }
      }
    });
    
    const teamUtilizationAvg = teamMembers.length > 0 
      ? Math.min(100, Math.round(totalUtilization / teamMembers.length)) 
      : 0;

    // partiallyAllocatedCount is now calculated directly in the loop above
    
    return {
      activeProjects,
      teamUtilizationAvg,
      zeroAllocationCount,
      partiallyAllocatedCount,
      fullyAllocatedCount
    };
  }

  async getTeamUtilization(): Promise<TeamUtilization[]> {
    const roleMap = new Map<string, { count: number, utilization: number }>();
    
    // Group team members by role
    Array.from(this.teamMembers.values()).forEach(member => {
      if (!roleMap.has(member.role)) {
        roleMap.set(member.role, { count: 0, utilization: 0 });
      }
      const roleData = roleMap.get(member.role)!;
      roleData.count++;
      
      // Calculate utilization for this member
      const memberAllocations = Array.from(this.allocations.values()).filter(
        allocation => allocation.teamMemberId === member.id
      );
      const utilizationSum = memberAllocations.reduce(
        (sum, allocation) => sum + allocation.percentage, 
        0
      );
      roleData.utilization += Math.min(100, utilizationSum);
    });
    
    // Convert to array and calculate averages
    return Array.from(roleMap.entries()).map(([role, data]) => ({
      role,
      memberCount: data.count,
      utilizationPercentage: Math.round(data.utilization / data.count)
    }));
  }

  async getTeamPerformance(): Promise<TeamPerformance[]> {
    // Generate last 6 months of performance data
    const today = new Date();
    const months: string[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      months.push(monthName);
    }
    
    // Generate improvement trend data with some fluctuation
    const baseCompletion = 65;
    const baseEfficiency = 70;
    
    return months.map((month, index) => {
      // Add some randomness but with an overall positive trend
      const trend = index * 3;
      const randomVariance = Math.floor(Math.random() * 10) - 5;
      
      return {
        month,
        completion: Math.min(98, Math.max(60, baseCompletion + trend + randomVariance)),
        efficiency: Math.min(98, Math.max(65, baseEfficiency + trend + randomVariance))
      };
    });
  }
  
  async getCategoryHours(): Promise<CategoryHours[]> {
    // Generate data for estimated vs actual hours by project category
    return [
      { category: 'Frontend', estimated: 450, actual: 480 },
      { category: 'Backend', estimated: 320, actual: 310 },
      { category: 'Design', estimated: 280, actual: 305 },
      { category: 'QA', estimated: 190, actual: 210 },
      { category: 'DevOps', estimated: 150, actual: 120 }
    ];
  }
  
  // Project Status methods
  async getProjectStatuses(): Promise<ProjectStatus[]> {
    return Array.from(this.projectStatuses.values());
  }
  
  async getProjectStatusesByProject(projectId: number): Promise<ProjectStatus[]> {
    return Array.from(this.projectStatuses.values())
      .filter(status => status.projectId === projectId);
  }
  
  async getProjectStatusByWeek(projectId: number, weekEndDate: string): Promise<ProjectStatus | undefined> {
    return Array.from(this.projectStatuses.values())
      .find(status => status.projectId === projectId && status.weekEndDate === weekEndDate);
  }
  
  async createProjectStatus(status: InsertProjectStatus): Promise<ProjectStatus> {
    const id = this.projectStatusesId++;
    const newStatus = { ...status, id };
    this.projectStatuses.set(id, newStatus);
    return newStatus;
  }
  
  async updateProjectStatus(id: number, status: Partial<InsertProjectStatus>): Promise<ProjectStatus | undefined> {
    const existingStatus = this.projectStatuses.get(id);
    if (!existingStatus) return undefined;
    
    const updatedStatus = { ...existingStatus, ...status };
    this.projectStatuses.set(id, updatedStatus);
    return updatedStatus;
  }
  
  async deleteProjectStatus(id: number): Promise<boolean> {
    return this.projectStatuses.delete(id);
  }

  // Seed initial data
  private seedData() {
    // Seed team members
    const teamMembers: InsertTeamMember[] = [
      { name: 'Sarah Johnson', role: 'UI Designer', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', availability: 25 },
      { name: 'Michael Chen', role: 'Frontend Developer', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', availability: 0 },
      { name: 'David Kim', role: 'Backend Developer', avatar: 'https://randomuser.me/api/portraits/men/68.jpg', availability: 50 },
      { name: 'Emily Rodriguez', role: 'UX Researcher', avatar: 'https://randomuser.me/api/portraits/women/17.jpg', availability: 20 },
      { name: 'Alex Morgan', role: 'QA Engineer', avatar: 'https://randomuser.me/api/portraits/men/75.jpg', availability: 70 },
      { name: 'Jessica Lee', role: 'UI Designer', avatar: 'https://randomuser.me/api/portraits/women/33.jpg', availability: 40 },
      { name: 'Robert Johnson', role: 'Frontend Developer', avatar: 'https://randomuser.me/api/portraits/men/91.jpg', availability: 10 },
      { name: 'Lisa Wang', role: 'Frontend Developer', avatar: 'https://randomuser.me/api/portraits/women/23.jpg', availability: 35 },
      { name: 'Mark Wilson', role: 'Backend Developer', avatar: 'https://randomuser.me/api/portraits/men/41.jpg', availability: 0 },
      { name: 'Anna Martinez', role: 'QA Engineer', avatar: 'https://randomuser.me/api/portraits/women/37.jpg', availability: 60 },
      { name: 'James Taylor', role: 'DevOps Engineer', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', availability: 30 },
      { name: 'Kevin Zhou', role: 'DevOps Engineer', avatar: 'https://randomuser.me/api/portraits/men/18.jpg', availability: 45 },
      { name: 'Sophia Davis', role: 'UI Designer', avatar: 'https://randomuser.me/api/portraits/women/19.jpg', availability: 55 },
      { name: 'Ryan Thomas', role: 'Frontend Developer', avatar: 'https://randomuser.me/api/portraits/men/54.jpg', availability: 75 },
      { name: 'Olivia Wilson', role: 'Frontend Developer', avatar: 'https://randomuser.me/api/portraits/women/26.jpg', availability: 15 },
      { name: 'Daniel Martinez', role: 'Backend Developer', avatar: 'https://randomuser.me/api/portraits/men/39.jpg', availability: 85 },
      { name: 'Emma Johnson', role: 'UX Researcher', avatar: 'https://randomuser.me/api/portraits/women/63.jpg', availability: 25 }
    ];

    teamMembers.forEach(member => {
      const id = this.teamMembersId++;
      this.teamMembers.set(id, { ...member, id });
    });

    // Seed projects
    const now = new Date();
    const projectsData: InsertProject[] = [
      { 
        name: 'E-commerce Redesign',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()),
        description: 'Redesign the e-commerce platform to improve user experience and conversion rates',
        color: '#2563eb'
      },
      { 
        name: 'CRM Dashboard',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() + 15),
        description: 'Develop a comprehensive CRM dashboard for sales team',
        color: '#4f46e5'
      },
      { 
        name: 'API Integration',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 25),
        description: 'Integrate third-party APIs for payment processing and shipping',
        color: '#22c55e'
      },
      { 
        name: 'Mobile App Redesign',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, now.getDate() + 10),
        description: 'Redesign the mobile app interface and improve performance',
        color: '#eab308'
      },
      { 
        name: 'Testing Automation',
        status: 'active',
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() + 5),
        description: 'Implement automated testing framework for CI/CD pipeline',
        color: '#ef4444'
      }
    ];

    projectsData.forEach(project => {
      const id = this.projectsId++;
      this.projects.set(id, { ...project, id });
    });

    // Seed timeline phases
    const timelinePhasesData: InsertTimelinePhase[] = [
      { projectId: 1, name: 'Planning', startWeek: 1, durationWeeks: 3, color: '#bfdbfe' },
      { projectId: 2, name: 'Design', startWeek: 3, durationWeeks: 4, color: '#c7d2fe' },
      { projectId: 3, name: 'Development', startWeek: 0, durationWeeks: 2, color: '#bbf7d0' },
      { projectId: 4, name: 'Testing', startWeek: 2, durationWeeks: 5, color: '#fef08a' },
      { projectId: 5, name: 'Deployment', startWeek: 6, durationWeeks: 3, color: '#fecaca' }
    ];

    timelinePhasesData.forEach(phase => {
      const id = this.timelinePhasesId++;
      this.timelinePhases.set(id, { ...phase, id });
    });

    // Seed allocations
    const allocationsData: InsertAllocation[] = [
      { teamMemberId: 1, projectId: 1, percentage: 75, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30), endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()) },
      { teamMemberId: 2, projectId: 2, percentage: 100, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15), endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() + 15) },
      { teamMemberId: 3, projectId: 3, percentage: 50, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 25) },
      { teamMemberId: 4, projectId: 4, percentage: 80, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20), endDate: new Date(now.getFullYear(), now.getMonth() + 2, now.getDate() + 10) },
      { teamMemberId: 5, projectId: 5, percentage: 30, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5), endDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() + 5) }
    ];

    allocationsData.forEach(allocation => {
      const id = this.allocationsId++;
      this.allocations.set(id, { ...allocation, id });
    });

    // Tasks section removed
  }
}

export class DatabaseStorage implements IStorage {
  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    const { db } = await import('./db');
    return await db.select().from(teamMembers);
  }

  async getTeamMember(id: number): Promise<TeamMember | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createTeamMember(teamMember: InsertTeamMember): Promise<TeamMember> {
    const { db } = await import('./db');
    const result = await db.insert(teamMembers).values(teamMember).returning();
    return result[0];
  }

  async updateTeamMember(id: number, teamMember: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.update(teamMembers)
      .set(teamMember)
      .where(eq(teamMembers.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.delete(teamMembers).where(eq(teamMembers.id, id)).returning();
    return result.length > 0;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    const { db } = await import('./db');
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const { db } = await import('./db');
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.delete(projects).where(eq(projects.id, id)).returning();
    return result.length > 0;
  }

  // Tasks section removed

  // Allocations
  async getAllocations(): Promise<Allocation[]> {
    const { db } = await import('./db');
    return await db.select().from(allocations);
  }

  async getAllocation(id: number): Promise<Allocation | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.select().from(allocations).where(eq(allocations.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getAllocationsByTeamMember(teamMemberId: number): Promise<Allocation[]> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(allocations).where(eq(allocations.teamMemberId, teamMemberId));
  }

  async getAllocationsByProject(projectId: number): Promise<Allocation[]> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(allocations).where(eq(allocations.projectId, projectId));
  }

  async createAllocation(allocation: InsertAllocation): Promise<Allocation> {
    const { db } = await import('./db');
    const result = await db.insert(allocations).values(allocation).returning();
    return result[0];
  }

  async updateAllocation(id: number, allocation: Partial<InsertAllocation>): Promise<Allocation | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.update(allocations)
      .set(allocation)
      .where(eq(allocations.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteAllocation(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.delete(allocations).where(eq(allocations.id, id)).returning();
    return result.length > 0;
  }

  // Timeline Phases
  async getTimelinePhases(): Promise<TimelinePhase[]> {
    const { db } = await import('./db');
    return await db.select().from(timelinePhases);
  }

  async getTimelinePhasesByProject(projectId: number): Promise<TimelinePhase[]> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(timelinePhases).where(eq(timelinePhases.projectId, projectId));
  }

  async createTimelinePhase(phase: InsertTimelinePhase): Promise<TimelinePhase> {
    const { db } = await import('./db');
    const result = await db.insert(timelinePhases).values(phase).returning();
    return result[0];
  }

  async updateTimelinePhase(id: number, phase: Partial<InsertTimelinePhase>): Promise<TimelinePhase | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.update(timelinePhases)
      .set(phase)
      .where(eq(timelinePhases.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTimelinePhase(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.delete(timelinePhases).where(eq(timelinePhases.id, id)).returning();
    return result.length > 0;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const { db } = await import('./db');
    const { eq, isNull, count, and, sql } = await import('drizzle-orm');
    
    // Get active projects count
    const activeProjectsResult = await db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, 'active'));
    const activeProjects = activeProjectsResult[0].count;
    
    // Get team utilization average and allocation statistics
    const allAllocations = await db.select().from(allocations);
    const allTeamMembers = await db.select().from(teamMembers);
    
    let totalUtilization = 0;
    let zeroAllocationCount = 0;
    let partiallyAllocatedCount = 0;
    let fullyAllocatedCount = 0;
    
    // Calculate allocation statistics for each team member
    allTeamMembers.forEach(member => {
      const memberAllocations = allAllocations.filter(
        allocation => allocation.teamMemberId === member.id
      );
      const utilizationSum = memberAllocations.reduce(
        (sum, allocation) => sum + allocation.percentage, 
        0
      );
      
      totalUtilization += utilizationSum;
      
      // Track different allocation categories
      if (utilizationSum >= 100) {
        fullyAllocatedCount++;
      } else if (utilizationSum >= 75) {
        partiallyAllocatedCount++;
      } else {
        if (utilizationSum === 0) { zeroAllocationCount++; } else { partiallyAllocatedCount++; }
      }
    });
    
    const teamUtilizationAvg = allTeamMembers.length > 0 
      ? Math.min(100, Math.round(totalUtilization / allTeamMembers.length)) 
      : 0;
    
    // Return detailed dashboard stats
    return {
      activeProjects,
      teamUtilizationAvg,
      zeroAllocationCount,
      partiallyAllocatedCount,
      fullyAllocatedCount
    };
  }

  async getTeamUtilization(): Promise<TeamUtilization[]> {
    const { db } = await import('./db');
    const { eq, sql } = await import('drizzle-orm');
    
    // Get all team members and allocations
    const allTeamMembers = await db.select().from(teamMembers);
    const allAllocations = await db.select().from(allocations);
    
    // Group team members by role
    const roleMap = new Map<string, { count: number, utilization: number }>();
    
    allTeamMembers.forEach(member => {
      if (!roleMap.has(member.role)) {
        roleMap.set(member.role, { count: 0, utilization: 0 });
      }
      const roleData = roleMap.get(member.role)!;
      roleData.count++;
      
      // Calculate utilization for this member
      const memberAllocations = allAllocations.filter(
        allocation => allocation.teamMemberId === member.id
      );
      const utilizationSum = memberAllocations.reduce(
        (sum, allocation) => sum + allocation.percentage, 
        0
      );
      roleData.utilization += Math.min(100, utilizationSum);
    });
    
    // Convert to array and calculate averages
    return Array.from(roleMap.entries()).map(([role, data]) => ({
      role,
      memberCount: data.count,
      utilizationPercentage: Math.round(data.utilization / data.count)
    }));
  }

  async getTeamPerformance(): Promise<TeamPerformance[]> {
    // Generate last 6 months of performance data for database storage
    const today = new Date();
    const months: string[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      months.push(monthName);
    }
    
    // Generate improvement trend data with some fluctuation
    const baseCompletion = 65;
    const baseEfficiency = 70;
    
    return months.map((month, index) => {
      // Add some randomness but with an overall positive trend
      const trend = index * 3;
      const randomVariance = Math.floor(Math.random() * 10) - 5;
      
      return {
        month,
        completion: Math.min(98, Math.max(60, baseCompletion + trend + randomVariance)),
        efficiency: Math.min(98, Math.max(65, baseEfficiency + trend + randomVariance))
      };
    });
  }
  
  async getCategoryHours(): Promise<CategoryHours[]> {
    // Generate data for estimated vs actual hours by project category
    return [
      { category: 'Frontend', estimated: 450, actual: 480 },
      { category: 'Backend', estimated: 320, actual: 310 },
      { category: 'Design', estimated: 280, actual: 305 },
      { category: 'QA', estimated: 190, actual: 210 },
      { category: 'DevOps', estimated: 150, actual: 120 }
    ];
  }
  
  // Project Status
  async getProjectStatuses(): Promise<ProjectStatus[]> {
    const { db } = await import('./db');
    return await db.select().from(projectStatus);
  }
  
  async getProjectStatusesByProject(projectId: number): Promise<ProjectStatus[]> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    return await db.select().from(projectStatus).where(eq(projectStatus.projectId, projectId));
  }
  
  async getProjectStatusByWeek(projectId: number, weekEndDate: string): Promise<ProjectStatus | undefined> {
    const { db } = await import('./db');
    const { eq, and } = await import('drizzle-orm');
    const result = await db.select().from(projectStatus).where(
      and(
        eq(projectStatus.projectId, projectId),
        eq(projectStatus.weekEndDate, weekEndDate)
      )
    );
    return result[0];
  }
  
  async createProjectStatus(status: InsertProjectStatus): Promise<ProjectStatus> {
    const { db } = await import('./db');
    const [result] = await db.insert(projectStatus).values(status).returning();
    return result;
  }
  
  async updateProjectStatus(id: number, status: Partial<InsertProjectStatus>): Promise<ProjectStatus | undefined> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const [result] = await db.update(projectStatus)
      .set(status)
      .where(eq(projectStatus.id, id))
      .returning();
    return result;
  }
  
  async deleteProjectStatus(id: number): Promise<boolean> {
    const { db } = await import('./db');
    const { eq } = await import('drizzle-orm');
    const result = await db.delete(projectStatus).where(eq(projectStatus.id, id)).returning();
    return result.length > 0;
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
