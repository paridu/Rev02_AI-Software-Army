import { AgentProfile, AgentRole } from './types';

export const C_SUITE: AgentProfile[] = [
  {
    id: 'ceo-01',
    name: 'OVERLORD (CEO)',
    role: AgentRole.CEO,
    specialty: 'Strategy & Goal',
    description: 'Defines the high-level goal and business value.',
    icon: '👑'
  },
  {
    id: 'arch-01',
    name: 'ARCHITECT (CTO)',
    role: AgentRole.CTO,
    specialty: 'System Design',
    description: 'Converts goals into system architecture and file structures.',
    icon: '📐'
  },
  {
    id: 'pm-01',
    name: 'TASKMASTER (PM)',
    role: AgentRole.PM,
    specialty: 'Orchestration',
    description: 'Breaks down architecture into build tasks.',
    icon: '📋'
  }
];

export const WORKER_ARMY: AgentProfile[] = [
  // --- PLANNING & SPECIALIZED SPECS ---
  { id: 'product-owner', name: 'Product Owner', role: AgentRole.WORKER, specialty: 'PRD & Sitemap', description: 'Creates Product Requirements Document and Sitemaps.', icon: '📑' },
  { id: 'ctx-eng', name: 'Context Eng.', role: AgentRole.WORKER, specialty: 'Prompt Engineering', description: 'Designs System Prompts and Agent Contexts.', icon: '🧠' },
  { id: 'db-arch', name: 'DB Architect', role: AgentRole.WORKER, specialty: 'SQL & Schema', description: 'Designs Database Schemas and SQL relations.', icon: '🗄️' },

  // --- BUILDERS (Implementation) ---
  { id: 'builder-fe', name: 'Builder (Frontend)', role: AgentRole.WORKER, specialty: 'Next.js/React/HTML', description: 'Writes the actual frontend code based on spec.', icon: '⚛️' },
  { id: 'builder-be', name: 'Builder (Backend)', role: AgentRole.WORKER, specialty: 'Python/FastAPI/Node', description: 'Writes the actual backend code based on spec.', icon: '🐍' },
  { id: 'designer-ui', name: 'UI Designer', role: AgentRole.WORKER, specialty: 'CSS/Bootstrap/Tailwind', description: 'Handles styling, aesthetics, and responsive layout.', icon: '🎨' },
  { id: 'creative-coder', name: 'Creative Coder', role: AgentRole.WORKER, specialty: 'p5.js & Canvas', description: 'Creates interactive visuals and generative art.', icon: '✨' },
  
  // --- QUALITY & MAINTENANCE ---
  { id: 'janitor-01', name: 'Janitor (Refactor)', role: AgentRole.WORKER, specialty: 'Code Cleanup & Optimization', description: 'Refactors code, removes complexity, ensures clean code.', icon: '🧹' },
  { id: 'doc-01', name: 'Documenter', role: AgentRole.WORKER, specialty: 'Technical Writing', description: 'Writes README.md and technical documentation.', icon: '📝' },

  // --- SPECIALIZED SUPPORT (Optional) ---
  { id: 'dev-ops', name: 'Pipeline (DevOps)', role: AgentRole.WORKER, specialty: 'Docker/Vercel', description: 'Deployment configuration.', icon: '🚀' },
  { id: 'mkt-growth', name: 'Hacker (Growth)', role: AgentRole.WORKER, specialty: 'Growth Hacking', description: 'Growth strategy.', icon: '📈' }
];

export const INITIAL_TRENDS = [
  "AI Video Clipper for TikTok using Python + Next.js",
  "LinkedIn Lead Gen Scraper using Selenium + FastAPI",
  "Interactive Generative Art NFT Gallery with p5.js",
  "Real-time Dashboard with Bootstrap and SQL Analytics"
];