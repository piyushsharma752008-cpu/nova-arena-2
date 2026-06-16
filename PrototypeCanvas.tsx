import React from 'react';
import { Map, DollarSign, Heart } from 'lucide-react';

export function GameHUD() {
    return (
        <div className="pointer-events-none absolute inset-0 p-4 md:p-8 flex flex-col justify-between">
            {/* Top Bar */}
            <div className="flex justify-between items-start">
                
                {/* Mission Objective */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-4 md:p-5 rounded-2xl shadow-xl border-l-4 border-l-emerald-500 transform transition-all max-w-sm">
                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-1">Current Objective</h3>
                    <p className="text-white font-medium text-base md:text-xl leading-tight">Explore the Cartoon City</p>
                    <p className="text-slate-400 text-xs md:text-sm mt-2 leading-relaxed">Navigate through the procedurally generated city blocks and test the physics.</p>
                </div>

                {/* Stats Box */}
                <div className="flex flex-col gap-3">
                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        <span className="font-mono text-xl font-bold text-white tracking-widest">4,250</span>
                    </div>
                    
                    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-4 py-3 rounded-2xl flex items-center gap-4 shadow-lg">
                        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                        <div className="w-24 md:w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div className="w-full h-full bg-rose-500"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="flex justify-between items-end">
                
                {/* Minimap Placeholder */}
                <div className="w-32 h-32 md:w-48 md:h-48 bg-slate-900/80 backdrop-blur-md border-2 border-slate-700/80 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden">
                    <Map className="w-8 h-8 md:w-10 md:h-10 text-slate-500 opacity-40" />
                    <div className="absolute w-full h-full border-t border-slate-600/30 animate-spin-slow" />
                    
                    {/* Map center dot */}
                    <div className="absolute w-3 h-3 bg-emerald-400 shadow-[0_0_15px_#34d399] rounded-full top-1/2 left-1/2 -mt-1.5 -ml-1.5 z-10 hidden md:block" />
                    <div className="absolute w-2 h-2 bg-emerald-400 shadow-[0_0_15px_#34d399] rounded-full top-1/2 left-1/2 -mt-1 -ml-1 z-10 md:hidden" />
                </div>

                {/* Controls Guide */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-5 rounded-2xl shadow-xl font-mono text-slate-300 w-64 hidden sm:block">
                    <div className="text-emerald-400 font-bold mb-3 uppercase text-xs tracking-widest border-b border-slate-700/50 pb-2">Controls Reference</div>
                    <ul className="space-y-3 text-xs md:text-sm">
                        <li className="flex justify-between items-center bg-slate-800/50 px-3 py-1.5 rounded-lg">
                            <span className="text-slate-400 font-medium">Move</span> 
                            <span className="text-white font-bold tracking-wider">W A S D</span>
                        </li>
                        <li className="flex justify-between items-center bg-slate-800/50 px-3 py-1.5 rounded-lg">
                            <span className="text-slate-400 font-medium">Jump</span> 
                            <span className="text-white font-bold tracking-wider">SPACE</span>
                        </li>
                        <li className="flex justify-between items-center bg-slate-800/50 px-3 py-1.5 rounded-lg">
                            <span className="text-slate-400 font-medium">Look</span> 
                            <span className="text-white font-bold tracking-wider">DRAG MOUSE</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            {/* Mobile Controls note */}
            <div className="sm:hidden text-center mt-4">
                <span className="bg-slate-900/90 text-slate-300 text-[10px] font-mono px-3 py-1.5 rounded-full border border-slate-700/80">
                    Desktop controls recommended
                </span>
            </div>
        </div>
    );
}
