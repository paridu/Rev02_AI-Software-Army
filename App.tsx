import React, { useState, useEffect, useRef } from 'react';
import { 
  TerminalIcon, 
  CpuIcon, 
  BriefcaseIcon, 
  ActivityIcon, 
  CheckCircleIcon, 
  RefreshCwIcon,
  GithubIcon,
  Volume2Icon,
  VolumeXIcon,
  CodeIcon,
  EyeIcon
} from './components/Icons';
import { GanttChart } from './components/GanttChart';
import { AgentNetworkVisualizer } from './components/AgentNetworkVisualizer';
import { ArtifactViewer } from './components/ArtifactViewer';
import MatrixBackground from './components/MatrixBackground';
import { 
  AgentProfile, 
  AgentRole, 
  LogEntry, 
  MarketTrend, 
  ProcessingState, 
  ProjectTask,
  SystemStats
} from './types';
import { C_SUITE, WORKER_ARMY } from './constants';
import { 
  generateMarketTrend, 
  getCEODecision, 
  getPMPlan, 
  executeAgentTask 
} from './services/geminiService';
import { 
  createGitHubRepo, 
  generateMarkdownReport, 
  updateRepoReadme 
} from './services/githubService';

const App: React.FC = () => {
  const [state, setState] = useState<ProcessingState>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [trend, setTrend] = useState<MarketTrend | null>(null);
  const [ceoVision, setCeoVision] = useState<{ vision: string; kpis: string[] } | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
  
  // Stats System
  const [stats, setStats] = useState<SystemStats>({
    cpuLoad: 12,
    memoryUsage: 1024,
    tokenUsage: 0,
    totalCost: 0.000,
    uptime: 0
  });

  // TTS State
  const [isMuted, setIsMuted] = useState(false);
  
  // GitHub Integration States
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [repoUrl, setRepoUrl] = useState('');
  
  // Artifact Viewer State
  const [showArtifacts, setShowArtifacts] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // System Stats Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => {
        let targetCpu = 10;
        let memoryFluctuation = 0;
        
        if (state !== 'idle' && state !== 'finished') {
          targetCpu = 65 + Math.random() * 30; // High load during work
          memoryFluctuation = Math.random() * 50;
        } else {
          targetCpu = 10 + Math.random() * 15; // Idle load
        }

        return {
          ...prev,
          cpuLoad: prev.cpuLoad + (targetCpu - prev.cpuLoad) * 0.1, // Smooth transition
          memoryUsage: Math.min(16384, Math.max(1024, prev.memoryUsage + memoryFluctuation)),
          uptime: prev.uptime + 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  // TTS Effect - Read new logs
  useEffect(() => {
    if (logs.length > 0 && !isMuted) {
      const latestLog = logs[logs.length - 1];
      // Only read the message content to keep it concise
      speakText(latestLog.message);
    }
  }, [logs, isMuted]);

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to select a Thai voice if the text contains Thai characters
    const isThai = /[ก-๙]/.test(text);
    const voices = window.speechSynthesis.getVoices();
    
    if (isThai) {
      const thaiVoice = voices.find(v => v.lang.includes('th'));
      if (thaiVoice) utterance.voice = thaiVoice;
    }
    
    // Fallback or default settings
    utterance.rate = 1.1; 
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  // Switch to Gantt view when planning is done and execution starts
  useEffect(() => {
    if (tasks.length > 0 && state === 'executing' && viewMode === 'list') {
        setViewMode('gantt');
    }
  }, [tasks, state]);

  const addLog = (
    agentName: string, 
    role: AgentRole, 
    message: string, 
    type: LogEntry['type'] = 'info',
    details?: string
  ) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('th-TH'),
      agentName,
      role,
      message,
      type,
      details
    }]);
  };

  const updateUsageStats = (text: string) => {
    // Approximate: 4 chars = 1 token
    const estTokens = Math.ceil(text.length / 4);
    // Approximate cost: $0.10 per 1M tokens (Flash model assumption)
    const estCost = (estTokens / 1_000_000) * 0.10;

    setStats(prev => ({
      ...prev,
      tokenUsage: prev.tokenUsage + estTokens,
      totalCost: prev.totalCost + estCost
    }));
  };

  const logArtifactPurpose = (agentId: string) => {
    let message = "";
    switch(agentId) {
      case 'product-owner':
        message = "📄 Artifact Generated: PRD.md (ข้อกำหนดสินค้า) & sitemap.md (ผังเว็บไซต์)\n👉 วัตถุประสงค์: เพื่อเป็นพิมพ์เขียว (Blueprint) ให้ทีม Dev เข้าใจขอบเขตงานและ Flow ผู้ใช้";
        break;
      case 'arch-01':
        message = "📐 Artifact Generated: ARCHITECTURE.md (สถาปัตยกรรมระบบ)\n👉 วัตถุประสงค์: เพื่อระบุ Tech Stack, โครงสร้าง Folder และ API Spec ที่จะใช้ในการพัฒนา";
        break;
      case 'db-arch':
        message = "🗄️ Artifact Generated: SQL Schema / Database Design\n👉 วัตถุประสงค์: เพื่อวางโครงสร้างการจัดเก็บข้อมูล (Tables/Relations) ให้มีประสิทธิภาพและรองรับการขยายตัว";
        break;
      case 'ctx-eng':
        message = "🧠 Artifact Generated: Context / System Prompts\n👉 วัตถุประสงค์: เพื่อกำหนด 'สมอง' และ 'บุคลิกภาพ' ของ AI ในระบบ ให้ตอบสนองได้ตรงโจทย์ทางธุรกิจ";
        break;
      case 'designer-ui':
        message = "🎨 Artifact Generated: UI Styles / CSS System\n👉 วัตถุประสงค์: เพื่อกำหนด Design Token, สี, และ Theme ของแอพพลิเคชันให้สวยงามทันสมัย";
        break;
      case 'creative-coder':
        message = "✨ Artifact Generated: Generative Art Scripts (p5.js)\n👉 วัตถุประสงค์: เพื่อสร้างประสบการณ์ Visual ที่โต้ตอบได้ (Interactive Experience) และสร้างความโดดเด่นให้โปรดักต์";
        break;
      case 'doc-01':
        message = "📝 Artifact Generated: README.md\n👉 วัตถุประสงค์: เพื่อเป็นคู่มือการใช้งาน (Documentation) และอธิบายวิธีการติดตั้งระบบสำหรับนักพัฒนาคนอื่น";
        break;
      case 'janitor-01':
        message = "🧹 Artifact Generated: CODE_REVIEW.md\n👉 วัตถุประสงค์: เพื่อตรวจสอบคุณภาพโค้ด (Audit), ค้นหาจุดบกพร่อง และแนะนำการ Refactor ให้โค้ดสะอาดขึ้น";
        break;
      case 'builder-fe':
        message = "⚛️ Artifact Generated: Frontend Components (React/Next.js)\n👉 วัตถุประสงค์: แปลง Design และ Logic ให้เป็นหน้าจอที่ผู้ใช้สามารถใช้งานได้จริง";
        break;
      case 'builder-be':
        message = "🐍 Artifact Generated: Backend Logic (API/Services)\n👉 วัตถุประสงค์: สร้างระบบประมวลผลหลังบ้านและการเชื่อมต่อฐานข้อมูล";
        break;
    }

    if (message) {
      addLog('SYSTEM', AgentRole.WORKER, "ตรวจสอบวัตถุประสงค์ของ Artifact...", 'info', message);
    }
  };

  const startSimulation = async () => {
    setState('analyzing_market');
    setLogs([]);
    setTasks([]);
    setCeoVision(null);
    setTrend(null);
    setActiveAgents(new Set());
    setViewMode('list');
    setUploadStatus('idle');
    setRepoUrl('');
    // Reset session stats (keep cost cumulative? No, reset for new run)
    setStats(prev => ({ ...prev, tokenUsage: 0, totalCost: 0 }));

    addLog('SYSTEM', AgentRole.WORKER, 'กำลังเริ่มระบบ กองทัพ เอไอ ซอฟแวร์ protocol...', 'info');
    
    // Step 1: Scan Market
    addLog('SYSTEM', AgentRole.WORKER, 'กำลังสแกน Google Trends เพื่อหาโอกาส...', 'thinking');
    const marketTrend = await generateMarketTrend();
    updateUsageStats(JSON.stringify(marketTrend));
    setTrend(marketTrend);
    addLog('SYSTEM', AgentRole.WORKER, `ตรวจพบโอกาส: ${marketTrend.trend}`, 'success', marketTrend.opportunity);

    // Step 2: C-Suite Planning
    setState('c_suite_planning');
    
    // CEO
    addLog('OVERLORD', AgentRole.CEO, 'กำลังวิเคราะห์ความคุ้มค่าเชิงกลยุทธ์...', 'thinking');
    setActiveAgents(prev => new Set(prev).add('ceo-01'));
    
    const decision = await getCEODecision(marketTrend);
    updateUsageStats(JSON.stringify(decision));
    setCeoVision(decision);
    setActiveAgents(prev => {
      const next = new Set(prev);
      next.delete('ceo-01');
      return next;
    });
    addLog('OVERLORD', AgentRole.CEO, 'ออกคำสั่งกลยุทธ์เรียบร้อย', 'success', decision.vision);

    // CTO & PM
    addLog('TASKMASTER', AgentRole.PM, 'กำลังแตกกลยุทธ์เป็นหน่วยปฏิบัติการ...', 'thinking');
    setActiveAgents(prev => new Set(prev).add('pm-01').add('arch-01'));
    
    const plan = await getPMPlan(decision.vision, decision.kpis);
    updateUsageStats(JSON.stringify(plan));
    setTasks(plan);
    setActiveAgents(prev => {
      const next = new Set(prev);
      next.delete('pm-01');
      next.delete('arch-01');
      return next;
    });
    addLog('TASKMASTER', AgentRole.PM, `สร้างงานปฏิบัติการจำนวน ${plan.length} งาน`, 'success');

    // Step 3: Execution
    setState('executing');
    await executeTasks(plan, decision.vision);
    
    setState('finished');
    addLog('SYSTEM', AgentRole.WORKER, 'ภารกิจเสร็จสิ้น รอคำสั่งถัดไป', 'success');
  };

  const executeTasks = async (taskList: ProjectTask[], vision: string) => {
    const updatedTasks = [...taskList];
    const executionOrder = [...updatedTasks].sort((a, b) => a.startOffset - b.startOffset);

    for (let i = 0; i < executionOrder.length; i++) {
      const task = executionOrder[i];
      const realIndex = updatedTasks.findIndex(t => t.id === task.id);
      
      const worker = WORKER_ARMY.find(w => w.id === task.assignedAgentId) || C_SUITE.find(c => c.id === task.assignedAgentId);
      
      if (!worker) continue;

      updatedTasks[realIndex].status = 'in-progress';
      setTasks([...updatedTasks]);
      
      addLog(worker.name, worker.role, `กำลังเริ่มงาน: ${task.title}`, 'info');
      setActiveAgents(prev => new Set(prev).add(worker.id));

      const completedTasks = updatedTasks.filter(t => t.status === 'completed');
      
      try {
        const output = await executeAgentTask(worker, task, vision, completedTasks);
        updateUsageStats(output);
        
        updatedTasks[realIndex].status = 'completed';
        updatedTasks[realIndex].output = output;
        setTasks([...updatedTasks]);
        
        addLog(worker.name, worker.role, `งานเสร็จสิ้น`, 'success', output.substring(0, 100) + '...');
        logArtifactPurpose(worker.id);
        
      } catch (error: any) {
        updatedTasks[realIndex].status = 'failed';
        updatedTasks[realIndex].output = `Error: ${error.message}`;
        setTasks([...updatedTasks]);
        
        addLog(worker.name, worker.role, `งานล้มเหลว (Failed): ${task.title}`, 'error', error.message);
      } finally {
        setActiveAgents(prev => {
          const next = new Set(prev);
          next.delete(worker.id);
          return next;
        });
        
        await new Promise(r => setTimeout(r, 800));
      }
    }
  };

  const handleGitHubUpload = async () => {
    if (!githubToken) {
      alert("Please enter a GitHub Personal Access Token.");
      return;
    }
    if (!trend || !ceoVision) return;

    setUploadStatus('uploading');
    try {
      // 1. Generate Content
      const report = generateMarkdownReport(trend, ceoVision, tasks);
      const repoName = trend.projectName || `ai-army-${Date.now()}`;
      const description = `กองทัพ เอไอ ซอฟแวร์ Generated Project: ${trend.trend}`;

      // 2. Create Repo
      addLog('SYSTEM', AgentRole.WORKER, `กำลังสร้าง GitHub Repository: ${repoName}...`, 'thinking');
      const repoData = await createGitHubRepo(githubToken, repoName, description);
      
      // 3. Upload Report
      addLog('SYSTEM', AgentRole.WORKER, `กำลังอัปโหลดรายงานผลลัพธ์...`, 'thinking');
      await updateRepoReadme(githubToken, repoData.owner.login, repoData.name, report);

      setRepoUrl(repoData.html_url);
      setUploadStatus('success');
      setShowGithubModal(false);
      addLog('SYSTEM', AgentRole.WORKER, `Upload เสร็จสมบูรณ์!`, 'success', repoData.html_url);

    } catch (error: any) {
      console.error(error);
      setUploadStatus('error');
      addLog('SYSTEM', AgentRole.WORKER, `เกิดข้อผิดพลาดในการ Upload: ${error.message}`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-yellow-500 font-mono relative overflow-hidden selection:bg-yellow-500 selection:text-black">
      <MatrixBackground />
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none scanline z-50 opacity-20"></div>

      {/* Artifact Viewer Modal */}
      <ArtifactViewer 
        isOpen={showArtifacts} 
        onClose={() => setShowArtifacts(false)}
        tasks={tasks}
        projectName={trend?.projectName}
      />

      {/* GitHub Modal */}
      {showGithubModal && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4">
          <div className="bg-black border border-yellow-500 p-6 max-w-md w-full shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <GithubIcon className="w-6 h-6" /> 
              DEPLOY TO GITHUB
            </h2>
            <p className="text-xs text-yellow-500/70 mb-4">
              กรุณากรอก GitHub Personal Access Token (Classic) ที่มีสิทธิ์ 'repo' เพื่อสร้าง Repository ใหม่และอัปโหลดผลลัพธ์
            </p>
            <input 
              type="password" 
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-yellow-500/10 border border-yellow-500/50 p-2 text-yellow-500 focus:outline-none focus:border-yellow-500 mb-4 font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowGithubModal(false)}
                className="px-4 py-2 border border-yellow-500/30 text-yellow-500/50 hover:text-yellow-500 hover:border-yellow-500 text-xs"
              >
                CANCEL
              </button>
              <button 
                onClick={handleGitHubUpload}
                disabled={uploadStatus === 'uploading'}
                className="px-4 py-2 bg-yellow-500 text-black font-bold hover:bg-yellow-400 text-xs disabled:opacity-50"
              >
                {uploadStatus === 'uploading' ? 'DEPLOYING...' : 'CONFIRM UPLOAD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-yellow-500/50 flex flex-col bg-black/90 sticky top-0 z-40 shadow-lg backdrop-blur-sm">
        {/* Top Bar */}
        <div className="p-4 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-3">
            <CpuIcon className="w-8 h-8 animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold tracking-widest text-shadow-glow">กองทัพ เอไอ ซอฟแวร์</h1>
              <p className="text-xs text-yellow-500/60">AUTONOMOUS AI SOFTWARE ARMY v9.1 (THAI_LANG)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${state === 'idle' || state === 'finished' ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></span>
              STATUS: {state === 'idle' ? 'STANDBY' : state === 'finished' ? 'COMPLETED' : 'PROCESSING'}
            </div>

            {/* Mute Button */}
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-2 border border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-500 rounded-sm transition-colors"
              title={isMuted ? "Unmute TTS" : "Mute TTS"}
            >
              {isMuted ? <VolumeXIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
            </button>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {(state === 'executing' || state === 'finished') && (
                <button 
                  onClick={() => setShowArtifacts(true)}
                  className="flex items-center gap-2 px-3 py-2 border border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors text-xs font-bold"
                >
                  <CodeIcon className="w-4 h-4" />
                  REVIEW CODE
                </button>
              )}

              {state === 'finished' && (
                <button 
                  onClick={() => repoUrl ? window.open(repoUrl, '_blank') : setShowGithubModal(true)}
                  className={`flex items-center gap-2 px-3 py-2 border text-xs font-bold uppercase transition-all ${
                    uploadStatus === 'success' 
                      ? 'bg-green-500 text-black border-green-500 hover:bg-green-400'
                      : 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black'
                  }`}
                >
                  <GithubIcon className="w-4 h-4" />
                  {uploadStatus === 'success' ? 'OPEN REPO' : 'UPLOAD'}
                </button>
              )}

              <button 
                onClick={startSimulation}
                disabled={state !== 'idle' && state !== 'finished'}
                className="flex items-center gap-2 px-4 py-2 border border-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]"
              >
                <TerminalIcon className="w-4 h-4" />
                RUN SEQUENCE
              </button>
            </div>
          </div>
        </div>
        
        {/* Resource HUD Bar */}
        <div className="grid grid-cols-4 border-t border-yellow-500/30 text-[10px] font-bold uppercase relative z-20 bg-black/80">
          <div className="p-1 px-4 border-r border-yellow-500/30 flex justify-between items-center bg-yellow-500/5">
             <span className="opacity-70">Neural Load</span>
             <span className={`${stats.cpuLoad > 80 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
               {stats.cpuLoad.toFixed(1)}%
             </span>
             <div className="w-16 h-1 bg-yellow-900/50 ml-2 rounded overflow-hidden">
               <div className={`h-full ${stats.cpuLoad > 80 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${stats.cpuLoad}%` }}></div>
             </div>
          </div>
          <div className="p-1 px-4 border-r border-yellow-500/30 flex justify-between items-center bg-yellow-500/5">
             <span className="opacity-70">Mem Usage</span>
             <span>{stats.memoryUsage.toFixed(0)} MB</span>
          </div>
          <div className="p-1 px-4 border-r border-yellow-500/30 flex justify-between items-center bg-yellow-500/5">
             <span className="opacity-70">Tokens / Cost</span>
             <span>{stats.tokenUsage.toLocaleString()} T / ${stats.totalCost.toFixed(4)}</span>
          </div>
          <div className="p-1 px-4 flex justify-between items-center bg-yellow-500/5">
             <span className="opacity-70">System Uptime</span>
             <span>{Math.floor(stats.uptime / 60)}m {stats.uptime % 60}s</span>
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-120px)] flex-col md:flex-row relative z-10">
        {/* Logs */}
        <div className="w-full md:w-1/3 border-r border-yellow-500/30 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="p-2 border-b border-yellow-500/30 text-xs font-bold flex items-center gap-2 bg-yellow-500/10">
            <TerminalIcon className="w-4 h-4" /> SYSTEM LOGS
          </div>
          <div ref={logContainerRef} className="flex-1 overflow-auto p-4 space-y-2">
            {logs.length === 0 && <div className="text-yellow-500/30 text-center text-xs mt-10">AWAITING SYSTEM START...</div>}
            {logs.map((log) => (
              <div key={log.id} className="text-xs font-mono mb-2">
                <div className="flex gap-2 opacity-70">
                  <span>{log.timestamp}</span>
                  <span className={`font-bold ${log.role === AgentRole.CEO ? 'text-purple-400' : 'text-yellow-500'}`}>[{log.agentName}]</span>
                </div>
                <div className={`pl-4 border-l ${
                  log.type === 'error' ? 'border-red-500 text-red-400' :
                  log.type === 'success' ? 'border-green-500 text-green-400' :
                  'border-yellow-500/30 text-yellow-500/80'
                }`}>
                  {log.message}
                  {log.details && <div className="mt-1 p-2 bg-white/5 rounded text-[10px] whitespace-pre-wrap">{log.details}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visualization */}
        <div className="w-full md:w-2/3 flex flex-col relative bg-grid-pattern">
          <div className="h-1/2 border-b border-yellow-500/30 relative bg-black/80 backdrop-blur-sm overflow-hidden">
             <div className="absolute top-2 right-2 z-10 flex gap-2">
               <button onClick={() => setViewMode('list')} className={`p-1 border ${viewMode === 'list' ? 'bg-yellow-500 text-black' : 'text-yellow-500 border-yellow-500/30'}`}><BriefcaseIcon className="w-4 h-4"/></button>
               <button onClick={() => setViewMode('gantt')} className={`p-1 border ${viewMode === 'gantt' ? 'bg-yellow-500 text-black' : 'text-yellow-500 border-yellow-500/30'}`}><ActivityIcon className="w-4 h-4"/></button>
             </div>
             
             {/* P5 VISUALIZER */}
             <AgentNetworkVisualizer activeAgents={activeAgents} tasks={tasks} />

             {trend && (
               <div className="absolute bottom-4 left-4 max-w-sm bg-black/90 border border-yellow-500/30 p-2 backdrop-blur pointer-events-none">
                 <div className="text-[10px] text-yellow-500/50 uppercase">Active Objective</div>
                 <div className="font-bold text-xs text-yellow-500">{trend.trend}</div>
               </div>
             )}
          </div>
          <div className="h-1/2 overflow-hidden flex flex-col bg-black/80 backdrop-blur-sm">
            {viewMode === 'gantt' ? (
              <GanttChart tasks={tasks} />
            ) : (
              <div className="p-4 overflow-auto h-full">
                <div className="text-xs font-bold mb-2 flex items-center gap-2"><BriefcaseIcon className="w-4 h-4"/> MISSION TASKS</div>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div key={task.id} className="border border-yellow-500/20 p-2 flex justify-between items-center text-xs hover:bg-yellow-500/5 bg-black/40">
                      <div>
                        <div className="font-bold text-yellow-500">{task.title}</div>
                        <div className="text-yellow-500/50">{task.assignedAgentId}</div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] uppercase ${
                        task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        task.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' :
                        'bg-white/5 text-gray-500'
                      }`}>{task.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;