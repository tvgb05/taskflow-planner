export type User = {
  id: number;
  name: string;
  email: string;
  email_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
};

export type Project = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  icon: string;
  project_type: ProjectType;
  planning_mode: PlanningMode;
  deadline: string;
  available_minutes_per_day: number;
  tasks_count: number;
  done_tasks_count: number;
  progress: number;
  tasks: Task[];
  created_at: string;
  updated_at: string;
};

export type ProjectType = "short_term" | "long_term" | "daily_recurring";
export type PlanningMode = "phased" | "recurring" | "pipeline";

export type ResourceLink = {
  title: string;
  url: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type SubtaskStatus = "todo" | "done";

export type Task = {
  id: number;
  project_id: number | null;
  standalone: boolean;
  title: string;
  description: string | null;
  resources: ResourceLink[];
  phase: string | null;
  source: "manual" | "ai";
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  estimated_minutes: number | null;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
};

export type Subtask = {
  id: number;
  task_id: number;
  title: string;
  description: string | null;
  resources: ResourceLink[];
  status: SubtaskStatus;
  estimated_minutes: number | null;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduleSubtask = {
  id: number;
  title: string;
  task_id: number;
  task_title: string;
  priority: TaskPriority;
  estimated_minutes: number;
};

export type ScheduleDay = {
  date: string;
  used_minutes: number;
  subtasks: ScheduleSubtask[];
};

export type AiSuggestedSubtask = {
  title: string;
  description: string;
  resources: ResourceLink[];
  estimated_minutes: number;
  scheduled_date: string;
};

export type AiSuggestion = {
  title: string;
  phase: string;
  description: string;
  resources: ResourceLink[];
  deadline: string;
  estimated_minutes: number;
  priority: TaskPriority;
  repeat_weekly: boolean;
  subtasks: AiSuggestedSubtask[];
};

export type ValidationErrors = Record<string, string[]>;
