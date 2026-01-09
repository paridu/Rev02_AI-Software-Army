import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { ProjectTask } from '../types';
import { 
  FileIcon, 
  CodeIcon, 
  DownloadIcon, 
  XIcon, 
  TerminalIcon 
} from './Icons';

interface ArtifactViewerProps {
  tasks: ProjectTask[];
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface VirtualFile {
  name: string;
  content: string;
  language: string;
  agent: string;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ 
  tasks, 
  projectName = "ai-software-army-project", 
  isOpen, 
  onClose 
}) => {
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  // Parse tasks to extract code blocks
  useEffect(() => {
    if (isOpen) {
      const extractedFiles: VirtualFile[] = [];
      
      tasks.forEach(task => {
        if (!task.output || task.status !== 'completed') return;

        // Regex to find: ### filename.ext \n ```lang \n content \n ```
        // Flexible enough to catch variations
        const fileRegex = /###\s+([a-zA-Z0-9_./-]+)(?:\r?\n)+```([a-zA-Z0-9]*)(?:\r?\n)([\s\S]*?)(?:\r?\n)```/g;
        
        let match;
        while ((match = fileRegex.exec(task.output)) !== null) {
          extractedFiles.push({
            name: match[1].trim(),
            language: match[2].trim() || 'text',
            content: match[3],
            agent: task.assignedAgentId
          });
        }
      });

      // Also generate a README if one wasn't explicitly parsed but we have data
      if (!extractedFiles.find(f => f.name.toLowerCase() === 'readme.md')) {
        // We could synthesize one here, but usually doc-01 does it.
      }

      setFiles(extractedFiles);
      if (extractedFiles.length > 0) {
        setSelectedFile(extractedFiles[0]);
      }
    }
  }, [isOpen, tasks]);

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add all extracted files
      files.forEach(file => {
        zip.file(file.name, file.content);
      });

      // Add a meta file
      zip.file("ai-army-manifest.json", JSON.stringify({
        project: projectName,
        generatedAt: new Date().toISOString(),
        totalFiles: files.length,
        agents: [...new Set(files.map(f => f.agent))]
      }, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (e) {
      console.error("Failed to zip", e);
      alert("Failed to generate ZIP file.");
    } finally {
      setIsZipping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8">
      <div className="bg-black border border-yellow-500 w-full h-full max-w-6xl flex flex-col shadow-[0_0_50px_rgba(234,179,8,0.2)]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-center gap-3">
            <CodeIcon className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-lg font-bold tracking-widest text-yellow-500">ARTIFACT VIEWER</h2>
              <p className="text-xs text-yellow-500/60 font-mono">CODE REVIEW & FILESYSTEM // {files.length} FILES DETECTED</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadZip}
              disabled={files.length === 0 || isZipping}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black text-xs font-bold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
            >
              <DownloadIcon className="w-4 h-4" />
              {isZipping ? 'COMPRESSING...' : 'DOWNLOAD ZIP'}
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-yellow-500 hover:bg-yellow-500/20 border border-transparent hover:border-yellow-500/30 transition-all"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* File Explorer (Left Sidebar) */}
          <div className="w-64 border-r border-yellow-500/30 bg-black/40 flex flex-col">
            <div className="p-3 text-xs font-bold text-yellow-500/50 border-b border-yellow-500/10 flex items-center gap-2">
              <TerminalIcon className="w-3 h-3" /> FILESYSTEM
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {files.length === 0 && (
                <div className="text-yellow-500/30 text-xs text-center mt-10 p-2">
                  No code artifacts generated yet. Run the simulation first.
                </div>
              )}
              {files.map((file, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 text-xs font-mono truncate flex items-center gap-2 transition-colors border-l-2 ${
                    selectedFile === file 
                      ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' 
                      : 'text-yellow-500/60 border-transparent hover:bg-yellow-500/10 hover:text-yellow-500'
                  }`}
                >
                  <FileIcon className="w-3 h-3 shrink-0" />
                  {file.name}
                </button>
              ))}
            </div>
          </div>

          {/* Code Editor (Main View) */}
          <div className="flex-1 flex flex-col bg-[#0d0d0d] relative">
            {selectedFile ? (
              <>
                <div className="flex justify-between items-center px-4 py-2 border-b border-yellow-500/10 bg-black">
                  <span className="text-xs font-mono text-yellow-500">
                    {selectedFile.name} 
                    <span className="opacity-50 ml-2">({selectedFile.language})</span>
                  </span>
                  <span className="text-[10px] text-yellow-500/40 uppercase border border-yellow-500/20 px-2 py-0.5 rounded">
                    Authored by: {selectedFile.agent}
                  </span>
                </div>
                <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                  <pre className="text-xs font-mono leading-relaxed text-gray-300">
                    <code className="whitespace-pre">{selectedFile.content}</code>
                  </pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-yellow-500/20">
                <CodeIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-mono">SELECT A FILE TO REVIEW</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};