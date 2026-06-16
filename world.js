/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import { listenAuth, loginWithGoogle, loginAsGuest, logout, authState } from './game/firebase';

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [screen, setScreen] = useState<'LOGIN' | 'MAIN_MENU' | 'PLAYING'>('LOGIN');

  useEffect(() => {
    const unsub = listenAuth((u, p) => {
      setUser(u);
      setProfile(p);
      setAuthChecked(true);
      if (u) {
        setScreen('MAIN_MENU');
      } else {
        setScreen('LOGIN');
      }
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    try { await loginWithGoogle(); } catch (e) { console.error(e); }
  };

  const handleGuestLogin = async () => {
    try { await loginAsGuest(); } catch (e) { console.error(e); }
  };

  if (!authChecked) {
    return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-emerald-400 font-mono">LOADING...</div>;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans selection:bg-emerald-500/30 text-slate-100">
      
      {screen === 'LOGIN' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 z-50">
          <h1 className="text-5xl font-black italic tracking-tighter text-white mb-2">NOVA CITY <span className="text-emerald-500">ARENA</span></h1>
          <p className="text-slate-400 mb-12 font-mono uppercase tracking-widest text-sm">Competitive Multiplayer Shooter</p>
          
          <div className="flex flex-col gap-4 w-72">
            <button onClick={handleGoogleLogin} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">
              Sign In with Google
            </button>
            <button onClick={handleGuestLogin} className="w-full py-4 bg-slate-800 text-white font-bold uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-colors">
              Play as Guest
            </button>
          </div>
        </div>
      )}

      {screen === 'MAIN_MENU' && (
        <div className="absolute inset-0 flex flex-col bg-slate-900 z-40 p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white">NOVA CITY <span className="text-emerald-500">ARENA</span></h1>
              <p className="text-emerald-400 font-mono mt-1">Logged in as: {profile?.username || user?.displayName || 'Guest'}</p>
            </div>
            <button onClick={() => logout()} className="px-6 py-2 border border-slate-700 text-slate-300 font-mono hover:bg-slate-800 transition-colors">LOGOUT</button>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-slate-800/80 p-8 rounded-xl border border-slate-700 flex flex-col items-center w-96">
              <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-6">
                <span className="text-3xl font-bold text-slate-500">{profile?.rankPoints || 0}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1 uppercase tracking-widest">
                {getRank(profile?.rankPoints || 0)}
              </h2>
              <div className="flex gap-4 mb-8 text-slate-400 font-mono text-sm">
                <div>W: {profile?.wins || 0}</div>
                <div>L: {profile?.losses || 0}</div>
                <div>K: {profile?.kills || 0}</div>
                <div>D: {profile?.deaths || 0}</div>
              </div>
              
              <button onClick={() => setScreen('PLAYING')} className="w-full py-4 bg-emerald-500 text-slate-950 text-xl font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors">
                FIND MATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'PLAYING' && (
        <>
          <GameCanvas onExit={() => setScreen('MAIN_MENU')} />
          {/* Overlay will be handled separately or added here later */}
        </>
      )}

    </div>
  );
}

function getRank(points: number) {
  if (points >= 2000) return "Nova Elite";
  if (points >= 1500) return "Master";
  if (points >= 1100) return "Diamond";
  if (points >= 800) return "Platinum";
  if (points >= 500) return "Gold";
  if (points >= 200) return "Silver";
  return "Bronze";
}

