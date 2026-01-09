export enum AgentRole {
  CEO = 'CEO',
  CTO = 'CTO',
  PM = 'PM',
  WORKER = 'WORKER'
}

export interface AgentProfile {
  id: string;
  name: string;
  role: AgentRole;
  specialty: string;
  description: string;
  icon: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  role: AgentRole;
  message: string;
  type: 'info' | 'success' | 'error' | 'thinking';
  details?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  assignedAgentId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  output?: string;
  duration: number; // Simulated duration units
  startOffset: number; // Simulated start time unit
}

export interface MarketTrend {
  trend: string;
  sector: string;
  opportunity: string;
  projectName: string; // New field for Repo Name
}

export interface SystemStats {
  cpuLoad: number;      // 0-100%
  memoryUsage: number;  // MB
  tokenUsage: number;   // Total tokens
  totalCost: number;    // USD
  uptime: number;       // Seconds
}

export type ProcessingState = 'idle' | 'analyzing_market' | 'c_suite_planning' | 'delegating' | 'executing' | 'finished';