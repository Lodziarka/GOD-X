
import React, { useState, useEffect } from 'react';
import { User, HealthStats } from '../types';
import { X, Watch, Smartphone, Bluetooth, CloudSync, Activity, ShieldCheck, Zap, ChevronRight, Loader2, RefreshCw, Radio } from 'lucide-react';

interface DeviceManagerProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  healthStats: HealthStats;
  onClose: () => void;
  onManualSync?: () => void;
}

const DeviceManager: React.FC<DeviceManagerProps> = ({ user, setUser, healthStats, onClose, onManualSync }) => {
  const [pairingDevice, setPairingDevice] = useState<string | null>(null);
  const [syncingDevices, setSyncingDevices] = useState<string[]>([]);

  const toggleDevice = (deviceId: string) => {
    const current = user.connectedDevices || [];
    const isConnecting = !current.includes(deviceId);
    
    if (isConnecting) {
      setPairingDevice(deviceId);
      setTimeout(() => {
        const updated = [...current, deviceId];
        setUser({ ...user, connectedDevices: updated });
        setPairingDevice(null);
      }, 3000);
    } else {
      const updated = current.filter(id => id !== deviceId);
      setUser({ ...user, connectedDevices: updated });
    }
  };

  const handleMasterSync = () => {
    if (!user.connectedDevices || user.connectedDevices.length === 0) return;
    
    setSyncingDevices([...user.connectedDevices]);
    if (onManualSync) onManualSync();

    setTimeout(() => {
      setSyncingDevices([]);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black z-[120] flex flex-col p-8 animate-in slide-in-from-bottom duration-500 overflow-y-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">Neural Link</h2>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em] mt-2">Biometric Interface v4.0</p>
        </div>
        <button onClick={onClose} className="p-4 bg-zinc-900/50 rounded-full text-zinc-400 hover:text-white transition-all border border-zinc-800">
          <X size={20} />
        </button>
      </header>

      <div className="space-y-8 flex-1">
        {/* Live Status Card */}
        <section className="bg-zinc-950 border border-zinc-900 rounded-[40px] p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-6 right-8 flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
             <span className="text-[8px] font-black text-white uppercase tracking-widest">Link Active</span>
          </div>
          
          <div className="flex items-center gap-6 mb-10">
             <div className="w-16 h-16 bg-orange-500/10 rounded-[24px] flex items-center justify-center border border-orange-500/20">
                <Activity size={32} className="text-orange-500 animate-pulse" />
             </div>
             <div>
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest block mb-1">Live Telemetry</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white tabular-nums">{healthStats.heartRate}</span>
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-widest">BPM</span>
                </div>
             </div>
          </div>

          <div className="flex justify-between items-end gap-1 h-16">
             {[...Array(30)].map((_, i) => (
               <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-orange-500/10 to-orange-500 rounded-full transition-all duration-300" 
                style={{ 
                  height: `${20 + Math.random() * 80}%`,
                  opacity: 0.2 + (Math.random() * 0.8)
                }} 
               />
             ))}
          </div>
        </section>

        {/* Master Sync Action */}
        <div className="px-2">
           <button 
            onClick={handleMasterSync}
            disabled={!user.connectedDevices || user.connectedDevices.length === 0 || syncingDevices.length > 0}
            className="w-full bg-zinc-900/40 border border-zinc-800 hover:border-orange-500/50 p-6 rounded-[32px] flex items-center justify-between group transition-all disabled:opacity-30"
           >
              <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-2xl ${syncingDevices.length > 0 ? 'bg-orange-500 text-white animate-spin' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}`}>
                    <RefreshCw size={20} />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Wymuś Synchronizację</p>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Ostatnio: {new Date(healthStats.lastSync).toLocaleTimeString()}</p>
                 </div>
              </div>
              <ChevronRight size={20} className="text-zinc-800 group-hover:text-white transition-colors" />
           </button>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4 px-4">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-orange-500" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Node Grid</h4>
            </div>
            <span className="text-[8px] font-bold text-zinc-800 uppercase tracking-widest">{user.connectedDevices?.length || 0} Connected</span>
          </div>
          
          <div className="grid gap-4">
            <PairingCard 
              id="apple" 
              name="Apple Health" 
              brand="HealthKit Bridge"
              icon={<Smartphone size={24} />} 
              status={pairingDevice === 'apple' ? 'pairing' : (syncingDevices.includes('apple') ? 'syncing' : (user.connectedDevices?.includes('apple') ? 'connected' : 'idle'))}
              onClick={() => toggleDevice('apple')}
            />
            <PairingCard 
              id="garmin" 
              name="Garmin Connect" 
              brand="ANT+ Protocol"
              icon={<Watch size={24} />} 
              status={pairingDevice === 'garmin' ? 'pairing' : (syncingDevices.includes('garmin') ? 'syncing' : (user.connectedDevices?.includes('garmin') ? 'connected' : 'idle'))}
              onClick={() => toggleDevice('garmin')}
            />
            <PairingCard 
              id="samsung" 
              name="Samsung Health" 
              brand="Privileged Link"
              icon={<Bluetooth size={24} />} 
              status={pairingDevice === 'samsung' ? 'pairing' : (syncingDevices.includes('samsung') ? 'syncing' : (user.connectedDevices?.includes('samsung') ? 'connected' : 'idle'))}
              onClick={() => toggleDevice('samsung')}
            />
          </div>
        </section>
      </div>

      <footer className="mt-12 bg-black py-4">
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-[32px] flex items-center gap-4 mb-8">
           <ShieldCheck size={20} className="text-zinc-600" />
           <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">System wykorzystuje szyfrowanie end-to-end dla wszystkich odczytów biometrycznych przekazywanych do GOD X Neural Cloud.</p>
        </div>
        <button 
          onClick={onClose}
          className="w-full bg-white text-black py-6 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-all active:scale-[0.98] shadow-2xl shadow-white/5"
        >
          Confirm Linkages
        </button>
      </footer>
    </div>
  );
};

const PairingCard: React.FC<{ 
  id: string, 
  name: string, 
  brand: string,
  icon: React.ReactNode, 
  status: 'connected' | 'pairing' | 'syncing' | 'idle',
  onClick: () => void 
}> = ({ id, name, brand, icon, status, onClick }) => (
  <button 
    onClick={onClick}
    disabled={status === 'pairing' || status === 'syncing'}
    className={`w-full group flex justify-between items-center p-6 rounded-[32px] border transition-all duration-500 ${
      status === 'connected' ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-600' : 
      status === 'pairing' || status === 'syncing' ? 'bg-zinc-900 border-orange-500/50' :
      'bg-black border-zinc-900 opacity-60 hover:opacity-100'
    }`}
  >
     <div className="flex items-center gap-5 text-left">
        <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center transition-all ${
          status === 'connected' ? 'bg-orange-500/10 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 
          status === 'syncing' ? 'bg-orange-500 text-white animate-spin-slow' :
          'bg-zinc-900 text-zinc-700'
        }`}>
           {status === 'pairing' ? <Loader2 className="animate-spin" /> : icon}
        </div>
        <div>
          <span className={`font-black text-sm uppercase tracking-tighter block ${status === 'connected' ? 'text-white' : 'text-zinc-500'}`}>{name}</span>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-700">{brand}</span>
        </div>
     </div>
     
     <div className="flex items-center gap-4">
        {status === 'connected' ? (
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-green-500 uppercase tracking-widest border border-green-500/20 px-2 py-1 rounded-full bg-green-500/5 mb-1">Synced</span>
            <span className="text-[6px] font-bold text-zinc-800 uppercase tracking-widest">Status: Ready</span>
          </div>
        ) : status === 'syncing' ? (
          <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest animate-pulse">Syncing...</span>
        ) : status === 'pairing' ? (
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Handshake...</span>
        ) : (
          <div className="w-8 h-8 rounded-full border border-zinc-900 flex items-center justify-center group-hover:border-zinc-700 transition-colors">
            <Plus size={14} className="text-zinc-800 group-hover:text-zinc-500" />
          </div>
        )}
     </div>

     <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
     `}</style>
  </button>
);

const Plus = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default DeviceManager;
