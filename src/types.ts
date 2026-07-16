export interface Task {
  id: string;
  title: string;
  description?: string;
  category: "Work" | "Personal" | "Health" | "Study" | "Routine";
  complexity: "Low" | "Medium" | "High";
  duration: number; // user estimate in minutes
  start: string; // HH:MM
  end: string; // HH:MM
  status: "todo" | "completed";
  priority: "low" | "medium" | "high";
  reminderActive: boolean;
  subtasks: { id: string; text: string; completed: boolean }[];
  
  // AI / ML Predictions
  predictedTimeMinutes?: number;
  confidenceScore?: number;
  reasoning?: string;
  efficiencyTips?: string[];
  dynamicBreakdown?: string[];
  optimizationNote?: string;
}

export interface Attachment {
  name: string;
  size: string;
  type: string;
  content?: string; // base64 for images, text for docs
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts?: any[]; // for sending complex multimodal payloads to backend
  timestamp: Date;
  attachment?: Attachment;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface TimePrediction {
  predictedTimeMinutes: number;
  confidenceScore: number;
  reasoning: string;
  efficiencyTips: string[];
  dynamicBreakdown: string[];
}

export interface TrainingExemplar {
  id: string;
  scenario: string;
  idealOutput: string;
  isActive: boolean;
  createdAt: string;
}
