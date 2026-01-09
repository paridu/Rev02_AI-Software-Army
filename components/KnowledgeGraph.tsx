import React, { useMemo } from 'react';
import { ProjectTask, AgentProfile } from '../types';
import { C_SUITE, WORKER_ARMY } from '../constants';

interface KnowledgeGraphProps {
  tasks: ProjectTask[];
  activeAgents: Set<string>;
}

interface Node {
  id: string;
  x: number;
  y: number;
  role: string;
  agent: AgentProfile;
}

interface Link {
  source: string;
  target: string;
  active: boolean;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ tasks, activeAgents }) => {
  // Compute layout based on hierarchy and assigned tasks
  const { nodes, links } = useMemo(() => {
    // 1. Define Nodes
    const nodeList: Node[] = [];
    
    // Helper to safely find agent
    const findAgent = (id: string) => [...C_SUITE, ...WORKER_ARMY].find(a => a.id === id);

    // Level 0: CEO
    const ceo = findAgent('ceo-01');
    if (ceo) nodeList.push({ id: 'ceo-01', x: 50, y: 10, role: 'CEO', agent: ceo });
    
    // Level 1: Architect (CTO) & PM
    const arch = findAgent('arch-01');
    if (arch) nodeList.push({ id: 'arch-01', x: 30, y: 30, role: 'ARCH', agent: arch });
    
    const pm = findAgent('pm-01');
    if (pm) nodeList.push({ id: 'pm-01', x: 70, y: 30, role: 'PM', agent: pm });

    // Level 2: Workers
    const assignedWorkerIds = Array.from(new Set(tasks.map(t => t.assignedAgentId)));
    const workers = WORKER_ARMY.filter(w => assignedWorkerIds.includes(w.id));

    if (workers.length > 0) {
      const step = 100 / (workers.length + 1);
      workers.forEach((worker, i) => {
        nodeList.push({
          id: worker.id,
          x: step * (i + 1),
          y: 70 + (i % 2) * 10, // Stagger rows slightly
          role: 'WORKER',
          agent: worker
        });
      });
    }

    // 2. Define Links
    const linkList: Link[] = [];
    
    // Command Chain
    linkList.push({ source: 'ceo-01', target: 'arch-01', active: activeAgents.has('ceo-01') || activeAgents.has('arch-01') });
    linkList.push({ source: 'ceo-01', target: 'pm-01', active: activeAgents.has('ceo-01') || activeAgents.has('pm-01') });
    linkList.push({ source: 'arch-01', target: 'pm-01', active: activeAgents.has('arch-01') || activeAgents.has('pm-01') }); // Collaboration

    // Delegation to Workers
    workers.forEach(w => {
      // Logic: PM assigns tasks generally, Architect assigns tech/builder tasks
      linkList.push({ source: 'pm-01', target: w.id, active: activeAgents.has('pm-01') || activeAgents.has(w.id) });
      
      if (w.id.startsWith('builder') || w.id === 'janitor-01' || w.id.startsWith('dev')) {
         linkList.push({ source: 'arch-01', target: w.id, active: activeAgents.has('arch-01') || activeAgents.has(w.id) });
      }
    });

    return { nodes: nodeList, links: linkList };
  }, [tasks, activeAgents]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black/80 flex items-center justify-center p-4">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Links */}
        {links.map((link, i) => {
          const start = nodes.find(n => n.id === link.source);
          const end = nodes.find(n => n.id === link.target);
          
          if (!start || !end) return null;

          return (
            <g key={`${link.source}-${link.target}-${i}`}>
              <line 
                x1={start.x} y1={start.y} x2={end.x} y2={end.y} 
                stroke={link.active ? "#eab308" : "#eab308"} 
                strokeWidth="0.5" 
                strokeOpacity={link.active ? "0.8" : "0.2"}
              />
              {/* Data Packet Animation */}
              {link.active && (
                <circle r="1" fill="#fff">
                  <animateMotion 
                    dur="1s" 
                    repeatCount="indefinite"
                    path={`M${start.x},${start.y} L${end.x},${end.y}`}
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isActive = activeAgents.has(node.id);
          return (
            <g key={node.id} className="cursor-pointer group">
              {/* Glow Effect for Active */}
              {isActive && (
                <circle cx={node.x} cy={node.y} r="6" fill="#eab308" fillOpacity="0.3">
                  <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              
              {/* Core Node */}
              <circle 
                cx={node.x} cy={node.y} r="4" 
                fill={isActive ? "#eab308" : "#000"} 
                stroke="#eab308" strokeWidth="0.5"
              />
              
              {/* Icon / Text */}
              <text 
                x={node.x} y={node.y} 
                dy="1.5" textAnchor="middle" 
                fontSize="3" 
                fill={isActive ? "#000" : "#eab308"}
                className="pointer-events-none"
              >
                {node.agent.icon}
              </text>

              {/* Label (Hidden by default, shown on hover) */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                 <rect x={node.x - 10} y={node.y - 8} width="20" height="4" fill="#000" stroke="#eab308" strokeWidth="0.2" rx="1" />
                 <text x={node.x} y={node.y - 5.5} textAnchor="middle" fontSize="2" fill="#eab308" fontWeight="bold">
                    {node.agent.name.split(' ')[0]}
                 </text>
              </g>
            </g>
          );
        })}
      </svg>
      
      {/* Legend / Overlay info */}
      <div className="absolute bottom-2 left-2 text-[10px] text-yellow-500/50 pointer-events-none">
        <div>NODES: {nodes.length} | LINKS: {links.length}</div>
        <div className="flex items-center gap-2 mt-1">
             <span className="w-2 h-2 rounded-full bg-yellow-500/20 border border-yellow-500 block"></span> IDLE
             <span className="w-2 h-2 rounded-full bg-yellow-500 block animate-pulse"></span> ACTIVE
        </div>
      </div>
    </div>
  );
};