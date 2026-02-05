"use client";

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Workflows Page - Tenant Admin
   Projects and Tasks management
   ═══════════════════════════════════════════════════════════════════════════ */

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
  task_count: number;
  tasks?: Task[];
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  project_id: string | null;
  project?: { id: string; name: string; color: string };
  checklist: { id: string; title: string; done: boolean }[];
  created_at: string;
}

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<"tasks" | "projects">("tasks");
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("active");
  const [filterProject, setFilterProject] = useState<string>("");
  
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/workflows/projects?include_tasks=true");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, []);
  
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      let url = "/api/workflows/tasks?limit=100";
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }
      if (filterProject) {
        url += `&project_id=${filterProject}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterProject]);

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, [filterStatus, filterProject, loadProjects, loadTasks]);
  
  async function updateTaskStatus(taskId: string, status: string) {
    try {
      const res = await fetch(`/api/workflows/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (res.ok) {
        setTasks(prev => prev.map(t => 
          t.id === taskId ? { ...t, status } : t
        ));
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  }
  
  const priorityColors: Record<string, string> = {
    critical: "var(--error)",
    high: "var(--warning)",
    normal: "var(--electric-cyan)",
    low: "var(--text-muted)",
  };
  
  const statusColors: Record<string, string> = {
    todo: "var(--text-muted)",
    in_progress: "var(--electric-lime)",
    blocked: "var(--error)",
    done: "var(--success)",
    cancelled: "var(--text-muted)",
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Workflows
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage your projects and tasks
          </p>
        </div>
        
        <button
          onClick={() => activeTab === "tasks" ? setShowAddTask(true) : setShowAddProject(true)}
          className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add {activeTab === "tasks" ? "Task" : "Project"}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "tasks"
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "projects"
                ? "bg-[var(--electric-lime)] text-[var(--void)]"
                : "bg-[var(--surface-1)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Projects ({projects.length})
          </button>
        </div>
        
        {activeTab === "tasks" && (
          <div className="flex items-center gap-3 ml-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm"
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          Loading...
        </div>
      ) : activeTab === "tasks" ? (
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No tasks yet
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Create your first task to get started
              </p>
              <button
                onClick={() => setShowAddTask(true)}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110"
              >
                Create Task
              </button>
            </div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done")}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      task.status === "done"
                        ? "bg-[var(--success)] border-[var(--success)] text-white"
                        : "border-[var(--border)] hover:border-[var(--electric-lime)]"
                    }`}
                  >
                    {task.status === "done" && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${
                        task.status === "done" 
                          ? "text-[var(--text-muted)] line-through" 
                          : "text-[var(--text-primary)]"
                      }`}>
                        {task.title}
                      </h3>
                      <span
                        className="px-1.5 py-0.5 text-xs rounded"
                        style={{
                          backgroundColor: `${priorityColors[task.priority]}20`,
                          color: priorityColors[task.priority],
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      {task.project && (
                        <span className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          {task.project.name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={
                          new Date(task.due_date) < new Date() && task.status !== "done"
                            ? "text-[var(--error)]"
                            : ""
                        }>
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.checklist?.length > 0 && (
                        <span>
                          {task.checklist.filter(c => c.done).length}/{task.checklist.length} checklist
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className="px-2 py-1 rounded text-xs bg-transparent border border-[var(--border-subtle)]"
                    style={{ color: statusColors[task.status] }}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--surface-1)] flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                No projects yet
              </h3>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                Create a project to organize your tasks
              </p>
              <button
                onClick={() => setShowAddProject(true)}
                className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110"
              >
                Create Project
              </button>
            </div>
          ) : (
            projects.map(project => (
              <div
                key={project.id}
                className="p-5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[var(--electric-lime)] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <span style={{ color: project.color }} className="text-lg">
                      {project.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--text-primary)] truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {project.tasks?.length || 0} tasks
                    </p>
                  </div>
                </div>
                
                {project.description && (
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">
                    {project.description}
                  </p>
                )}
                
                {project.tasks && project.tasks.length > 0 && (
                  <div className="space-y-1">
                    {project.tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: statusColors[task.status] }}
                        />
                        <span className={
                          task.status === "done"
                            ? "text-[var(--text-muted)] line-through"
                            : "text-[var(--text-secondary)]"
                        }>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {project.tasks.length > 3 && (
                      <p className="text-xs text-[var(--text-muted)]">
                        +{project.tasks.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          projects={projects}
          onClose={() => setShowAddTask(false)}
          onCreated={(task) => {
            setTasks(prev => [task, ...prev]);
            setShowAddTask(false);
          }}
        />
      )}
      
      {/* Add Project Modal */}
      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onCreated={(project) => {
            setProjects(prev => [project, ...prev]);
            setShowAddProject(false);
          }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Add Task Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function AddTaskModal({
  projects,
  onClose,
  onCreated,
}: {
  projects: Project[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/workflows/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || undefined,
          project_id: projectId || undefined,
          priority,
          due_date: dueDate || undefined,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        onCreated(data.task);
      }
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Add Task
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="">No Project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Add Project Modal
   ═══════════════════════════════════════════════════════════════════════════ */

function AddProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#f59e0b", "#10b981", "#14b8a6",
  ];
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/workflows/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description || undefined,
          color,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        onCreated(data.project);
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setSaving(false);
    }
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xl">
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            New Project
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              autoFocus
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--electric-lime)]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--electric-lime)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-transform ${
                    color === c ? "scale-110 ring-2 ring-white" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-4 py-2 rounded-lg bg-[var(--electric-lime)] text-[var(--void)] font-medium hover:brightness-110 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
