import React, { useEffect, useRef } from 'react';
import p5 from 'p5';
import { AgentProfile, ProjectTask } from '../types';
import { C_SUITE, WORKER_ARMY } from '../constants';

interface VisualizerProps {
  activeAgents: Set<string>;
  tasks: ProjectTask[];
}

export const AgentNetworkVisualizer: React.FC<VisualizerProps> = ({ activeAgents, tasks }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeAgentsRef = useRef(activeAgents);
  const tasksRef = useRef(tasks);

  // Keep refs synced with props for the p5 draw loop
  useEffect(() => {
    activeAgentsRef.current = activeAgents;
    tasksRef.current = tasks;
  }, [activeAgents, tasks]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let agents: any[] = [];
      let particles: any[] = [];
      const ALL_AGENTS = [...C_SUITE, ...WORKER_ARMY];

      class AgentNode {
        id: string;
        name: string;
        role: string;
        pos: p5.Vector;
        basePos: p5.Vector;
        size: number;
        icon: string;
        pulse: number;
        
        constructor(profile: AgentProfile, x: number, y: number) {
          this.id = profile.id;
          this.name = profile.name;
          this.role = profile.role;
          this.icon = profile.icon;
          this.pos = p.createVector(x, y);
          this.basePos = p.createVector(x, y);
          this.size = 30;
          this.pulse = 0;
        }

        update() {
          const isActive = activeAgentsRef.current.has(this.id);
          
          // Gentle floating
          this.pos.y = this.basePos.y + p.sin(p.frameCount * 0.05 + this.basePos.x) * 2;

          if (isActive) {
            this.pulse += 0.2;
            // Emit particles
            if (p.frameCount % 5 === 0) {
              particles.push(new Particle(this.pos.x, this.pos.y));
            }
          } else {
            this.pulse = p.lerp(this.pulse, 0, 0.1);
          }
        }

        draw() {
          const isActive = activeAgentsRef.current.has(this.id);
          
          // Draw connections
          p.strokeWeight(1);
          if (isActive) {
            p.stroke(234, 179, 8, 150);
          } else {
            p.stroke(234, 179, 8, 30);
          }
          
          // Hierarchy lines (Simplified logic for visuals)
          if (this.role === 'CEO') {
             // Connect to Level 1
             agents.filter(a => a.role === 'CTO' || a.role === 'PM').forEach(target => {
               this.drawLine(target);
             });
          } else if (this.role === 'CTO' || this.role === 'PM') {
             // Connect to Workers
             agents.filter(a => a.role === 'WORKER').forEach(target => {
               this.drawLine(target);
             });
          }

          // Draw Node Glow
          if (isActive || this.pulse > 0.1) {
            p.noFill();
            p.stroke(234, 179, 8, 200 - this.pulse * 10);
            p.circle(this.pos.x, this.pos.y, this.size + p.sin(this.pulse) * 10);
            p.stroke(234, 179, 8, 100);
            p.circle(this.pos.x, this.pos.y, this.size + p.sin(this.pulse + 1) * 20);
          }

          // Draw Core
          p.fill(0);
          p.stroke(234, 179, 8);
          p.strokeWeight(isActive ? 2 : 1);
          p.circle(this.pos.x, this.pos.y, this.size);

          // Icon
          p.fill(255);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(14);
          p.text(this.icon, this.pos.x, this.pos.y);

          // --- LABELS (ALWAYS VISIBLE) ---
          p.textAlign(p.CENTER);
          p.noStroke();

          // 1. Role (Smallest, top of label stack)
          p.textSize(8);
          p.fill(234, 179, 8, 150);
          p.text(`[${this.role}]`, this.pos.x, this.pos.y + 24);

          // 2. Name (Main label)
          p.textSize(10);
          p.fill(234, 179, 8);
          
          // Clean name logic
          let dName = this.name.split(' ')[0]; // Take first word for brevity
          
          if (isActive) {
            // "Glitch" effect for text when active
            if (p.random() < 0.1) dName = dName.replace(/[a-z]/, (c) => String.fromCharCode(c.charCodeAt(0) + 1));
            p.fill(255, 255, 100); // Brighter yellow/white
          }
          p.text(dName, this.pos.x, this.pos.y + 35);

          // 3. Active Task (Only when active)
          if (isActive) {
            const currentTask = tasksRef.current.find(t => t.assignedAgentId === this.id && t.status === 'in-progress');
            if (currentTask) {
              p.fill(50, 255, 50); // Green for active task
              p.textSize(8);
              p.text(`> ${currentTask.title.substring(0, 15)}...`, this.pos.x, this.pos.y + 46);
            }
          }
        }

        drawLine(target: AgentNode) {
          p.line(this.pos.x, this.pos.y, target.pos.x, target.pos.y);
          
          // Data packet
          if (activeAgentsRef.current.has(this.id) || activeAgentsRef.current.has(target.id)) {
            const t = (p.frameCount * 0.05) % 1;
            const lx = p.lerp(this.pos.x, target.pos.x, t);
            const ly = p.lerp(this.pos.y, target.pos.y, t);
            p.fill(255);
            p.noStroke();
            p.circle(lx, ly, 3);
          }
        }
      }

      class Particle {
        pos: p5.Vector;
        vel: p5.Vector;
        life: number;

        constructor(x: number, y: number) {
          this.pos = p.createVector(x, y);
          this.vel = p5.Vector.random2D().mult(p.random(0.5, 2));
          this.life = 255;
        }

        update() {
          this.pos.add(this.vel);
          this.life -= 5;
        }

        draw() {
          p.noStroke();
          p.fill(234, 179, 8, this.life);
          p.circle(this.pos.x, this.pos.y, 2);
        }
      }

      p.setup = () => {
        const w = containerRef.current?.offsetWidth || 600;
        const h = containerRef.current?.offsetHeight || 400;
        p.createCanvas(w, h);
        
        // Initialize Agents Layout
        const cx = w / 2;
        const cy = h / 2;

        // Level 0: CEO
        agents.push(new AgentNode(C_SUITE[0], cx, 50)); // CEO

        // Level 1: CTO / PM
        agents.push(new AgentNode(C_SUITE[1], cx - 100, 120)); // Architect
        agents.push(new AgentNode(C_SUITE[2], cx + 100, 120)); // PM

        // Level 2: Workers
        // Only show workers that have tasks or just a subset to avoid clutter, or all
        const workers = WORKER_ARMY;
        const workerY = 250;
        const spacing = w / (workers.length + 1);
        
        workers.forEach((wProfile, i) => {
          agents.push(new AgentNode(wProfile, spacing * (i + 1), workerY + (i % 2) * 30));
        });
      };

      p.draw = () => {
        p.clear();
        // Transparent BG handled by CSS, but we can darken slightly
        // p.background(0, 50); 

        // Update & Draw Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          particles[i].update();
          particles[i].draw();
          if (particles[i].life <= 0) particles.splice(i, 1);
        }

        // Update & Draw Agents
        agents.forEach(a => {
          a.update();
          a.draw();
        });
      };

      p.windowResized = () => {
         if (containerRef.current) {
            p.resizeCanvas(containerRef.current.offsetWidth, containerRef.current.offsetHeight);
            // Re-calc positions could go here but skipping for simplicity
         }
      };
    };

    const myP5 = new p5(sketch, containerRef.current);

    return () => {
      myP5.remove();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};