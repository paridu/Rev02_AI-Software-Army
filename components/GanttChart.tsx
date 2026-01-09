import React from 'react';
import { ProjectTask, AgentProfile } from '../types';
import { WORKER_ARMY, C_SUITE } from '../constants';

interface GanttChartProps {
  tasks: ProjectTask[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-yellow-500/30 text-sm border border-yellow-500/10 bg-black/50">
        รอแผนปฏิบัติการ... (AWAITING PLAN)
      </div>
    );
  }

  // Calculate total timeline width
  const maxTime = Math.max(...tasks.map(t => t.startOffset + t.duration), 10);
  
  // Combine lists for lookup
  const ALL_AGENTS = [...C_SUITE, ...WORKER_ARMY];

  return (
    <div className="w-full h-full flex flex-col bg-black/50 p-4 border border-yellow-500/20">
      <div className="flex justify-between mb-4 border-b border-yellow-500/20 pb-2 shrink-0">
        <span className="text-xs font-bold text-yellow-500 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
          GANTT TIMELINE VIEW
        </span>
        <span className="text-xs text-yellow-500/50">PROJECT DURATION: {maxTime} UNITS</span>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide relative">
        <div className="min-w-[600px]">
          {/* Time Markers */}
          <div className="flex border-b border-yellow-500/10 mb-2 pb-1 sticky top-0 bg-black/90 z-20">
            <div className="w-32 shrink-0 border-r border-yellow-500/10 mr-2"></div> {/* Spacer for names */}
            <div className="flex-1 flex relative h-4">
              {[...Array(maxTime + 1)].map((_, i) => (
                <div key={i} className="absolute h-full border-l border-yellow-500/10 text-[9px] text-yellow-500/30 pl-1" style={{ left: `${(i / maxTime) * 100}%` }}>
                  {i}
                </div>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3 pb-4">
            {tasks.map((task) => {
              const agent = ALL_AGENTS.find(a => a.id === task.assignedAgentId) || ALL_AGENTS.find(a => a.id === 'unknown');
              
              const leftPercent = (task.startOffset / maxTime) * 100;
              const widthPercent = (task.duration / maxTime) * 100;

              let barColorClass = "bg-yellow-500/20 border-yellow-500/40 text-yellow-500/70";
              if (task.status === 'in-progress') barColorClass = "bg-yellow-500 border-yellow-500 text-black animate-pulse font-bold";
              if (task.status === 'completed') barColorClass = "bg-green-500/80 border-green-500 text-black font-bold";
              if (task.status === 'failed') barColorClass = "bg-red-500/80 border-red-500 text-white";

              return (
                <div key={task.id} className="flex items-center group hover:bg-yellow-500/5 transition-colors p-1 rounded">
                  {/* Row Header */}
                  <div className="w-32 shrink-0 pr-2 flex items-center gap-2 overflow-hidden border-r border-yellow-500/10 mr-2">
                    <span className="text-lg opacity-80">{agent?.icon || '🤖'}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-yellow-500 truncate">{agent?.name.split(' ')[0] || task.assignedAgentId}</span>
                      <span className="text-[8px] text-yellow-500/50 truncate font-mono">{task.id.split('-').pop()}</span>
                    </div>
                  </div>

                  {/* Timeline Bar Container */}
                  <div className="flex-1 relative h-6 bg-yellow-500/5 rounded-sm">
                    {/* The Bar */}
                    <div 
                      className={`absolute top-0 bottom-0 border rounded-sm flex items-center px-2 transition-all duration-500 cursor-pointer ${barColorClass}`}
                      style={{ 
                        left: `${leftPercent}%`, 
                        width: `${Math.max(widthPercent, 1)}%` 
                      }}
                    >
                      <span className="text-[9px] truncate w-full block">
                        {task.title}
                      </span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block bg-black border border-yellow-500 p-2 z-30 w-64 text-xs shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                      <div className="font-bold text-yellow-500 mb-1 border-b border-yellow-500/30 pb-1">{task.title}</div>
                      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[10px]">
                        <span className="text-yellow-500/50">AGENT:</span>
                        <span className="text-yellow-500">{agent?.name}</span>
                        <span className="text-yellow-500/50">TIME:</span>
                        <span className="text-yellow-500">T+{task.startOffset} to T+{task.startOffset + task.duration} ({task.duration}u)</span>
                        <span className="text-yellow-500/50">STATUS:</span>
                        <span className={`uppercase ${task.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>{task.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
