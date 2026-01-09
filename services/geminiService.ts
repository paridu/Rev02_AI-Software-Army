import { GoogleGenAI, Type } from "@google/genai";
import { AgentProfile, ProjectTask, MarketTrend } from "../types";
import { WORKER_ARMY, C_SUITE } from "../constants";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model Constants
const REASONING_MODEL = "gemini-3-flash-preview"; 
const CREATIVE_MODEL = "gemini-3-flash-preview";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateMarketTrend = async (): Promise<MarketTrend> => {
  try {
    const ai = getAI();
    const prompt = `
      Generate a specific, high-potential "Micro-SaaS" or "Automation Tool" idea specifically for **Social Media Monetization** or **Creative AI**.
      
      Constraints:
      1. **Domain:** Social Media, E-Commerce, or Generative Art.
      2. **Product Type:** B2B Tool, Creator Tool, or Automation Bot.
      3. **Tech Stack:** Can involve Python, Next.js, p5.js, SQL, or Bootstrap.
      4. **Goal:** The tool must help users make money, save time, or create engagement.

      Return JSON with:
      - 'trend' (Thai): The core concept.
      - 'sector' (Thai): Specific niche.
      - 'opportunity' (Thai): Why this makes money now.
      - 'projectName' (English): A cool, developer-friendly kebab-case name for GitHub.
    `;

    const response = await ai.models.generateContent({
      model: CREATIVE_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trend: { type: Type.STRING },
            sector: { type: Type.STRING },
            opportunity: { type: Type.STRING },
            projectName: { type: Type.STRING }
          },
          required: ["trend", "sector", "opportunity", "projectName"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Trend Gen Error:", error);
    return {
      trend: "ระบบสร้าง Visualizer สำหรับเพลงด้วย p5.js",
      sector: "Creative Tools",
      opportunity: "ช่วยศิลปินสร้าง content ลง YouTube/TikTok ได้เร็วขึ้น",
      projectName: "audio-viz-generator"
    };
  }
};

export const getCEODecision = async (trend: MarketTrend): Promise<{ vision: string; kpis: string[] }> => {
  const ai = getAI();
  const prompt = `
    Role: CEO / Overlord
    Context: We are building a Micro-SaaS: "${trend.trend}".
    
    Task:
    1. Define a bold, strategic Vision for this product.
    2. Define 3 KPIs (MVP Success, User Acquisition, Revenue).
    
    Response Format (JSON):
    {
      "vision": "string (Thai)",
      "kpis": ["string (Thai)", "string (Thai)", "string (Thai)"]
    }
  `;

  const response = await ai.models.generateContent({
    model: REASONING_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vision: { type: Type.STRING },
          kpis: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"vision": "Error processing vision", "kpis": []}');
};

export const getPMPlan = async (vision: string, kpis: string[]): Promise<ProjectTask[]> => {
  const ai = getAI();
  const availableAgents = [...C_SUITE, ...WORKER_ARMY].map(a => `${a.id} (${a.specialty})`).join(", ");
  
  const prompt = `
    Role: Taskmaster (PM)
    Goal: Build the "${vision}"
    Agents: ${availableAgents}

    **Autopilot Protocol Enforcement:**
    You must generate a comprehensive waterfall plan (7-9 tasks) involving specialized agents:
    
    1. **product-owner**: Define PRD & Sitemap.
    2. **arch-01**: System Architecture.
    3. **db-arch**: SQL Schema design (if needed).
    4. **ctx-eng**: Define System Context/Prompts.
    5. **builder-be**: Core Logic/API.
    6. **builder-fe**: Frontend Structure.
    7. **designer-ui**: Styling (Bootstrap/Tailwind/CSS).
    8. **creative-coder**: Visuals (if needed, else skip).
    9. **doc-01**: Documentation.
    
    Ensure titles are in Thai.
  `;

  const response = await ai.models.generateContent({
    model: REASONING_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            assignedAgentId: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["pending"] }
          },
          required: ["id", "title", "assignedAgentId"]
        }
      }
    }
  });

  const rawTasks = JSON.parse(response.text || "[]");
  
  let currentOffset = 0;
  
  return rawTasks.map((t: any, index: number) => {
    const duration = Math.floor(Math.random() * 3) + 2;
    // Sequential waterfall
    const startOffset = currentOffset; 
    currentOffset = startOffset + duration;

    return {
      ...t,
      id: `task-${Date.now()}-${index}`,
      status: 'pending',
      duration: duration,
      startOffset: startOffset
    };
  });
};

export const executeAgentTask = async (
  agent: AgentProfile, 
  task: ProjectTask, 
  vision: string, 
  previousTasks: ProjectTask[] = []
): Promise<string> => {
  const ai = getAI();
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 2000;
  
  // Context Memory Construction
  const contextMemory = previousTasks
    .filter(t => t.status === 'completed' && t.output)
    .map(t => `\n--- OUTPUT FROM ${t.assignedAgentId} (${t.title}) ---\n${t.output?.substring(0, 1500)}...\n`)
    .join("\n");

  // Specialized Prompts based on Autopilot Spec
  let systemInstruction = "";
  
  // --- SPECIALIZED ROLES ---
  if (agent.id === 'product-owner') {
    systemInstruction = `
      You are the **Product Owner**.
      Goal: Define the Product Requirements and Sitemap.
      
      REQUIRED OUTPUT:
      Create two file sections:
      
      ### PRD.md
      \`\`\`markdown
      # Product Requirements Document
      ## Features
      ...
      ## User Flow
      ...
      \`\`\`

      ### sitemap.md
      \`\`\`markdown
      - /home
      - /dashboard
        - /settings
      \`\`\`
    `;
  } else if (agent.id === 'ctx-eng') {
    systemInstruction = `
      You are the **Context Engineer**.
      Goal: Design the "Brain" of the AI system or the Context for the application.
      
      REQUIRED OUTPUT:
      ### context.md
      \`\`\`markdown
      # System Prompt / Context
      Role: ...
      Personality: ...
      Knowledge Base: ...
      Constraints: ...
      \`\`\`
    `;
  } else if (agent.id === 'db-arch') {
    systemInstruction = `
      You are the **Database Architect**.
      Goal: Design the database schema.
      
      REQUIRED OUTPUT:
      ### schema.sql
      \`\`\`sql
      CREATE TABLE users (...);
      CREATE TABLE data (...);
      -- Add relationships and indexes
      \`\`\`
    `;
  } else if (agent.id === 'designer-ui') {
    systemInstruction = `
      You are the **UI Designer**.
      Goal: Define the styling strategy and CSS.
      
      REQUIRED OUTPUT:
      ### styles.css
      \`\`\`css
      /* Use modern CSS or define Bootstrap overrides */
      body { ... }
      .dashboard { ... }
      \`\`\`
      
      OR (if Tailwind/Bootstrap specified in vision):
      ### theme-config.js
      \`\`\`javascript
      // Theme settings
      \`\`\`
    `;
  } else if (agent.id === 'creative-coder') {
    systemInstruction = `
      You are the **Creative Coder**.
      Goal: Create interactive visuals using p5.js or Canvas API.
      
      REQUIRED OUTPUT:
      ### sketch.js
      \`\`\`javascript
      function setup() {
        createCanvas(400, 400);
      }
      function draw() {
        background(220);
        // ... generative logic ...
      }
      \`\`\`
    `;
  } 
  
  // --- STANDARD ROLES ---
  else if (agent.id === 'arch-01') {
    systemInstruction = `
      You are the **Architect Agent**.
      Goal: Convert User Goal & PRD into Technical Architecture.
      
      REQUIRED OUTPUT:
      ### ARCHITECTURE.md
      \`\`\`markdown
      1. Tech Stack (React/Next.js/Python/SQL/etc)
      2. File Structure Tree
      3. API Endpoints List
      \`\`\`
    `;
  } else if (agent.id.startsWith('builder')) {
    systemInstruction = `
      You are a **Builder Agent** (Fullstack/FE/BE).
      Goal: Write WORKING CODE based on Architecture & DB Schema.
      
      RULES:
      1. **Output actual code files**.
      2. Format: ### filename.ext \n \`\`\`lang \n code \n \`\`\`
      3. If React: Use functional components + Hooks.
      4. If HTML/JS: Use clean ES6+.
      5. If API: Use Python FastAPI or Node Express.
    `;
  } else if (agent.id === 'janitor-01') {
    systemInstruction = `
      You are the **Janitor Agent** (Code Quality).
      Goal: Refactor and Verify.
      
      REQUIRED OUTPUT:
      ### CODE_REVIEW.md
      \`\`\`markdown
      - Code Quality Score: A/B/C
      - Suggested Refactors: ...
      \`\`\`
    `;
  } else if (agent.id === 'doc-01') {
    systemInstruction = `
      You are the **Documenter Agent**.
      Goal: Write README.md.
      
      REQUIRED OUTPUT:
      ### README.md
      \`\`\`markdown
      # Project Name
      ## Installation
      ## Features
      \`\`\`
    `;
  } else {
    systemInstruction = `You are ${agent.name} (${agent.specialty}). Execute: ${task.title}. Provide output in file format blocks.`;
  }

  const prompt = `
    ${systemInstruction}
    
    Project Vision: ${vision}
    Current Task: ${task.title}
    
    CONTEXT (PREVIOUS WORK):
    ${contextMemory || "No previous work. You are starting fresh."}
    
    **EXECUTE NOW. RETURN OUTPUT IN MARKDOWN.**
  `;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: CREATIVE_MODEL,
        contents: prompt,
      });

      if (!response.text) throw new Error("Empty response from AI");
      return response.text;

    } catch (error: any) {
      console.warn(`[Task Execution] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed for ${agent.id}: ${error.message}`);
      
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new Error(`Execution failed after ${MAX_RETRIES + 1} attempts: ${error.message}`);
      }
    }
  }
  
  return "Execution Failed";
};