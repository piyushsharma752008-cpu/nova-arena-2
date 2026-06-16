import React, { useEffect, useRef, useState } from 'react';
import { bootstrap } from './main.js';
import { network } from './multiplayer.js';

export function GameCanvas({ onExit }: { onExit?: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const bootMsgRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        let engine: any;

        if (canvasRef.current) {
            // Start networking
            if (!network.connected) network.connect();
            
            // Connect to Babylon engine
            bootstrap(canvasRef.current, bootMsgRef.current).then((eng) => {
                engine = eng;
                setLoading(false);
            });
        }
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onExit) {
                // simple exit handling
                onExit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (engine) engine.dispose();
            // clean up network? No, keep it connected between screens for faster match load, or disconnect if proper exit
        }
    }, [onExit]);

    return (
        <div className="absolute inset-0 z-10 bg-slate-950">
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 pb-20">
                    <div className="text-center w-full max-w-md">
                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h2 className="text-2xl font-bold font-mono tracking-widest text-emerald-400">CONNECTING TO ARENA</h2>
                        <p ref={bootMsgRef} className="text-slate-400 mt-2 font-mono uppercase tracking-wide text-xs">Initializing...</p>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="w-full h-full block touch-none outline-none" tabIndex={0} />
            
            {/* Optional Overlay UI rendered over canvas but inside this component */}
            {!loading && (
                <>
                    <div className="absolute top-4 left-4 z-20 pointer-events-none font-mono text-emerald-400 font-bold">
                        [ESC] to Exit Match
                    </div>
                    
                    {/* Crosshair */}
                    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full border-2 border-emerald-400 bg-transparent opacity-80" />
                    </div>
                </>
            )}
        </div>
    );
}
