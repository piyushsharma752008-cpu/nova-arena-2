import React from 'react';
import { cn } from '../lib/utils';
import { docs } from '../data';
import { DeliverableSection } from '../types';
import { BookOpen, Box, Cpu, Database, Network, Map, Car, Zap, FileJson, Route, Users, Target, Play } from 'lucide-react';

interface SidebarProps {
  activeId: DeliverableSection;
  onSelect: (id: DeliverableSection) => void;
}

const icons: Record<DeliverableSection, React.ElementType> = {
  overview: BookOpen,
  architecture: Cpu,
  structure: FileJson,
  database: Database,
  network: Network,
  controller: Users, // Using Users as a proxy
  vehicle: Car,
  streaming: Map,
  npc: Users,
  missions: Target,
  performance: Zap,
  roadmap: Route,
  prototype: Play
};

export function Sidebar({ activeId, onSelect }: SidebarProps) {
  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto hidden md:flex">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 text-emerald-400">
          <Box className="w-8 h-8" />
          <h1 className="font-bold text-xl tracking-tight">STUDIO OS</h1>
        </div>
        <p className="text-slate-400 text-xs mt-2 font-mono uppercase tracking-wider">Project: Cartoon City sandbox</p>
      </div>
      
      <div className="flex-1 py-4">
        <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deliverables</div>
        <nav className="space-y-1 px-2">
          {docs.map((doc) => {
            const Icon = icons[doc.id];
            const isActive = activeId === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                  isActive 
                    ? "bg-slate-800 text-emerald-400" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500")} />
                <span className="truncate">{doc.title}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
