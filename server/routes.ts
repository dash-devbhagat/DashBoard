import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTeamMemberSchema, 
  insertProjectSchema, 
  insertTaskSchema, 
  insertAllocationSchema,
  insertTimelinePhaseSchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = app.route('/api');

  // Team Members
  app.get('/api/team-members', async (req: Request, res: Response) => {
    try {
      const { skill } = req.query;
      let teamMembers = await storage.getTeamMembers();
      
      // Filter by skill if provided
      if (skill && typeof skill === 'string') {
        teamMembers = teamMembers.filter(member => 
          member.skills && member.skills.some(s => 
            s.toLowerCase().includes(skill.toLowerCase())
          )
        );
      }
      
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get('/api/team-members/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const teamMember = await storage.getTeamMember(id);
      
      if (!teamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      res.json(teamMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.post('/api/team-members', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTeamMemberSchema.parse(req.body);
      const newTeamMember = await storage.createTeamMember(validatedData);
      res.status(201).json(newTeamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.patch('/api/team-members/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTeamMemberSchema.partial().parse(req.body);
      const updatedTeamMember = await storage.updateTeamMember(id, validatedData);
      
      if (!updatedTeamMember) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      res.json(updatedTeamMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete('/api/team-members/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTeamMember(id);
      
      if (!success) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Projects
  app.get('/api/projects', async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', async (req: Request, res: Response) => {
    try {
      // Enhanced validation with detailed error reporting
      try {
        // Validate the project data
        const validatedData = insertProjectSchema.parse(req.body);
        
        // Additional validation for consistency
        const startDate = new Date(validatedData.startDate);
        const endDate = new Date(validatedData.endDate);
        
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: "Invalid start date format" });
        }
        
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ message: "Invalid end date format" });
        }
        
        if (startDate > endDate) {
          return res.status(400).json({ message: "End date must be after start date" });
        }
        
        // Create the project
        const newProject = await storage.createProject(validatedData);
        res.status(201).json(newProject);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          // Format the error messages nicely
          const formattedErrors = validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: formattedErrors 
          });
        }
        throw validationError; // Re-throw if it's not a Zod error
      }
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Enhanced validation with detailed error reporting
      try {
        // Validate the project data using a less strict schema for updates
        const projectUpdateSchema = z.object({
          name: z.string().min(3).max(100).optional(),
          status: z.enum(["active", "completed", "pending"]).optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          description: z.string().max(500).nullable().optional(),
          color: z.string().optional(),
        });
        
        const validatedData = projectUpdateSchema.parse(req.body);
        
        // If both dates are provided, validate their consistency
        if (validatedData.startDate && validatedData.endDate) {
          const startDate = new Date(validatedData.startDate);
          const endDate = new Date(validatedData.endDate);
          
          if (isNaN(startDate.getTime())) {
            return res.status(400).json({ message: "Invalid start date format" });
          }
          
          if (isNaN(endDate.getTime())) {
            return res.status(400).json({ message: "Invalid end date format" });
          }
          
          if (startDate > endDate) {
            return res.status(400).json({ message: "End date must be after start date" });
          }
        }
        
        // Update the project
        const updatedProject = await storage.updateProject(id, validatedData);
        
        if (!updatedProject) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        res.json(updatedProject);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          // Format the error messages nicely
          const formattedErrors = validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: formattedErrors 
          });
        }
        throw validationError; // Re-throw if it's not a Zod error
      }
    } catch (error) {
      console.error("Project update error:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteProject(id);
      
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Tasks
  app.get('/api/tasks', async (req: Request, res: Response) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      let tasks;
      
      if (projectId) {
        tasks = await storage.getTasksByProject(projectId);
      } else {
        tasks = await storage.getTasks();
      }
      
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/unassigned', async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getUnassignedTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unassigned tasks" });
    }
  });

  app.get('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const newTask = await storage.createTask(validatedData);
      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Custom schema for task updates
      const taskUpdateSchema = z.object({
        title: z.string().min(3).max(100).optional(),
        description: z.string().max(500).optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
        status: z.enum(["not-started", "in-progress", "completed"]).optional(),
        estimatedHours: z.number().min(0).optional(),
        dueDate: z.string().optional(),
        category: z.string().optional(),
        projectId: z.number().nullable().optional(),
        assigneeId: z.number().nullable().optional(),
      });
      
      // Enhanced validation with detailed error reporting
      try {
        const validatedData = taskUpdateSchema.parse(req.body);
        
        // Validate due date if provided
        if (validatedData.dueDate) {
          const dueDate = new Date(validatedData.dueDate);
          
          if (isNaN(dueDate.getTime())) {
            return res.status(400).json({ message: "Invalid due date format" });
          }
        }
        
        const updatedTask = await storage.updateTask(id, validatedData);
        
        if (!updatedTask) {
          return res.status(404).json({ message: "Task not found" });
        }
        
        res.json(updatedTask);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          // Format the error messages nicely
          const formattedErrors = validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: formattedErrors 
          });
        }
        throw validationError; // Re-throw if it's not a Zod error
      }
    } catch (error) {
      console.error("Task update error:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTask(id);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Allocations
  app.get('/api/allocations', async (req: Request, res: Response) => {
    try {
      const teamMemberId = req.query.teamMemberId ? parseInt(req.query.teamMemberId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      let allocations;
      
      if (teamMemberId) {
        allocations = await storage.getAllocationsByTeamMember(teamMemberId);
      } else if (projectId) {
        allocations = await storage.getAllocationsByProject(projectId);
      } else {
        allocations = await storage.getAllocations();
      }
      
      res.json(allocations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch allocations" });
    }
  });

  app.get('/api/allocations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const allocation = await storage.getAllocation(id);
      
      if (!allocation) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      
      res.json(allocation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch allocation" });
    }
  });

  app.post('/api/allocations', async (req: Request, res: Response) => {
    try {
      const validatedData = insertAllocationSchema.parse(req.body);
      const newAllocation = await storage.createAllocation(validatedData);
      res.status(201).json(newAllocation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create allocation" });
    }
  });

  app.patch('/api/allocations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Custom schema for allocation updates
      const allocationUpdateSchema = z.object({
        teamMemberId: z.number().optional(),
        projectId: z.number().optional(),
        percentage: z.number().min(0).max(100).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      });
      
      // Enhanced validation with detailed error reporting
      try {
        const validatedData = allocationUpdateSchema.parse(req.body);
        
        // If both dates are provided, validate their consistency
        if (validatedData.startDate && validatedData.endDate) {
          const startDate = new Date(validatedData.startDate);
          const endDate = new Date(validatedData.endDate);
          
          if (isNaN(startDate.getTime())) {
            return res.status(400).json({ message: "Invalid start date format" });
          }
          
          if (isNaN(endDate.getTime())) {
            return res.status(400).json({ message: "Invalid end date format" });
          }
          
          if (startDate > endDate) {
            return res.status(400).json({ message: "End date must be after start date" });
          }
        }
        
        const updatedAllocation = await storage.updateAllocation(id, validatedData);
        
        if (!updatedAllocation) {
          return res.status(404).json({ message: "Allocation not found" });
        }
        
        res.json(updatedAllocation);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          // Format the error messages nicely
          const formattedErrors = validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: formattedErrors 
          });
        }
        throw validationError; // Re-throw if it's not a Zod error
      }
    } catch (error) {
      console.error("Allocation update error:", error);
      res.status(500).json({ message: "Failed to update allocation" });
    }
  });

  app.delete('/api/allocations/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAllocation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Allocation not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete allocation" });
    }
  });

  // Timeline Phases
  app.get('/api/timeline-phases', async (req: Request, res: Response) => {
    try {
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      
      let phases;
      
      if (projectId) {
        phases = await storage.getTimelinePhasesByProject(projectId);
      } else {
        phases = await storage.getTimelinePhases();
      }
      
      res.json(phases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timeline phases" });
    }
  });

  app.post('/api/timeline-phases', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTimelinePhaseSchema.parse(req.body);
      const newPhase = await storage.createTimelinePhase(validatedData);
      res.status(201).json(newPhase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create timeline phase" });
    }
  });

  app.patch('/api/timeline-phases/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid timeline phase ID" });
      }
      
      // Custom schema for timeline phase updates
      const timelinePhaseUpdateSchema = z.object({
        projectId: z.number().optional(),
        name: z.string().min(3).max(100).optional(),
        startWeek: z.number().min(1).optional(),
        durationWeeks: z.number().min(1).optional(),
        color: z.string().optional(),
      });
      
      // Enhanced validation with detailed error reporting
      try {
        const validatedData = timelinePhaseUpdateSchema.parse(req.body);
        
        const updatedPhase = await storage.updateTimelinePhase(id, validatedData);
        
        if (!updatedPhase) {
          return res.status(404).json({ message: "Timeline phase not found" });
        }
        
        res.json(updatedPhase);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          // Format the error messages nicely
          const formattedErrors = validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }));
          return res.status(400).json({ 
            message: "Validation failed", 
            errors: formattedErrors 
          });
        }
        throw validationError; // Re-throw if it's not a Zod error
      }
    } catch (error) {
      console.error("Timeline phase update error:", error);
      res.status(500).json({ message: "Failed to update timeline phase" });
    }
  });

  app.delete('/api/timeline-phases/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTimelinePhase(id);
      
      if (!success) {
        return res.status(404).json({ message: "Timeline phase not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete timeline phase" });
    }
  });

  // Dashboard Stats
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/team-utilization', async (req: Request, res: Response) => {
    try {
      const utilization = await storage.getTeamUtilization();
      res.json(utilization);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team utilization data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
