
import React, { useState, useRef, useEffect } from 'react';
import { User, PersonalRecord, HealthStats } from '../types';
import { EXERCISES } from '../constants';
import { Trophy, ChevronLeft, Settings, LogOut, Edit2, Check, X, Camera, ZoomIn, ZoomOut, Move, Watch, Activity, Share2 } from 'lucide-react';
import DeviceManager from './DeviceManager';

interface ProfileViewProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  records: PersonalRecord[];
  healthStats: HealthStats;
  onClose: () => void;
  onLogout: () => void;
  onManualSync?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setUser, records, healthStats, onClose, onLogout, onManualSync }) => {
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showDeviceManager, setShowDeviceManager] = useState(false);
  const [adjustingImage, setAdjustingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tempProfile, setTempProfile] = useState({
    name: user.name,
    avatar: user.avatar
  });

  const [tempGoals, setTempGoals] = useState({
    calories: user.targetCalories,
    protein: user.targetProtein,
    carbs: user.targetCarbs,
    fat: user.targetFat
  });

  const handleSaveGoals = () => {
    setUser({
      ...user,
      targetCalories: tempGoals.calories,
      targetProtein: tempGoals.protein,
      targetCarbs: tempGoals.carbs,
      targetFat: tempGoals.fat
    });
    setIsEditingGoals(false);
  };

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name: tempProfile.name,
      avatar: tempProfile.avatar
    });
    setIsEditingProfile(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdjustingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = (croppedBase64: string) => {
    setTempProfile(prev => ({ ...prev, avatar: croppedBase64 }));
    setAdjustingImage(null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GOD X - Fitness System',
          text: 'Sprawdź mój system treningowy GOD X!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Błąd udostępniania:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link do aplikacji został skopiowany do schowka!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col p-6 animate-in slide-in-from-right duration-300 overflow-y-auto custom-scrollbar">
      {adjustingImage && (
        <ImageAdjuster 
          imageSrc={adjustingImage} 
          onConfirm={handleCroppedImage} 
          onCancel={() => setAdjustingImage(null)} 
        />
      )}

      {showDeviceManager && (
        <DeviceManager 
          user={user} 
          setUser={setUser} 
          healthStats={healthStats} 
          onClose={() => setShowDeviceManager(false)}
          onManualSync={onManualSync}
        />
      )}

      <header className="flex justify-between items-center mb-8 sticky top-0 bg-black py-2 z-10">
        <button onClick={onClose} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-bold tracking-tight uppercase">Status Systemu</h2>
        {!isEditingProfile ? (
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="p-2 text-zinc-400 hover:text-orange-500 transition-colors"
          >
            <Edit2 size={20} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setIsEditingProfile(false)} className="p-2 text-zinc-500 hover:text-red-400">
              <X size={20} />
            </button>
            <button onClick={handleSaveProfile} className="p-2 text-green-500 hover:text-green-400">
              <Check size={20} />
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-col items-center mb-10">
        <div className="relative group">
          <div className={`w-32 h-32 rounded-full flex items-center justify-center border-2 overflow-hidden shadow-2xl transition-all ${isEditingProfile ? 'border-orange-500/50 scale-110' : 'border-zinc-800'}`}>
            {isEditingProfile ? (tempProfile.avatar ? (
              <img src={tempProfile.avatar} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-white">{tempProfile.name.charAt(0)}</span>
            )) : user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-white">{user.name.charAt(0)}</span>
            )}
            
            {isEditingProfile && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera size={24} className="text-white" />
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
          {user.connectedDevices && user.connectedDevices.length > 0 && (
            <div className="absolute bottom-1 right-1 bg-green-500 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center shadow-lg animate-pulse">
               <Watch size={14} className="text-white" />
            </div>
          )}
        </div>

        {isEditingProfile ? (
          <input 
            type="text"
            className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-3 text-center text-2xl font-black focus:outline-none focus:border-orange-500 w-full max-w-[240px] uppercase tracking-tighter"
            value={tempProfile.name}
            onChange={e => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
          />
        ) : (
          <>
            <h3 className="text-3xl font-black mt-6 uppercase tracking-tighter">{user.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest px-2 py-0.5 border border-orange-500/30 rounded-full">Level Alpha</span>
            </div>
          </>
        )}
      </div>

      <div className="space-y-10 pb-24">
        {/* SHARE APP BUTTON */}
        <button 
          onClick={handleShare}
          className="w-full bg-white text-black py-5 rounded-[32px] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-orange-500 hover:text-white transition-all active:scale-95"
        >
          <Share2 size={18} /> Udostępnij System
        </button>

        {/* NEURAL LINK SHORTCUT */}
        <section className="bg-zinc-950 border border-zinc-900 p-8 rounded-[40px] relative overflow-hidden group hover:border-orange-500/30 transition-all cursor-pointer shadow-xl" onClick={() => setShowDeviceManager(true)}>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-orange-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Neural Link Status</h4>
              </div>
              <p className="text-xl font-black text-white uppercase tracking-tighter">
                {user.connectedDevices?.length ? `${user.connectedDevices.length} Aktywne połączenia` : 'Brak urządzeń'}
              </p>
            </div>
            <button className="bg-zinc-900 p-4 rounded-2xl group-hover:bg-white group-hover:text-black transition-all">
               <Settings size={20} />
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
             <div className="text-[9px] font-bold text-zinc-700 uppercase">Ostatnia synchronizacja: {new Date(healthStats.lastSync).toLocaleTimeString()}</div>
             <div className="text-[9px] font-bold text-green-500 text-right uppercase tracking-widest animate-pulse">Bicie serca: {healthStats.heartRate} BPM</div>
          </div>
        </section>

        {/* Records */}
        <section>
          <div className="flex items-center gap-2 mb-6 ml-4">
            <Trophy size={16} className="text-orange-500" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Archiwum Potęgi</h4>
          </div>
          <div className="space-y-3">
            {records.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-900 rounded-[32px] text-zinc-800">
                 <p className="text-[9px] font-black uppercase tracking-widest">Oczekuję na rekordy</p>
              </div>
            ) : (
              records.map(rec => {
                const ex = EXERCISES.find(e => e.id === rec.exerciseId);
                return (
                  <div key={rec.exerciseId} className="bg-zinc-950 border border-zinc-900 p-5 rounded-[28px] flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-bold text-zinc-800 uppercase tracking-widest block mb-0.5">{ex?.category}</span>
                      <span className="font-black text-xs uppercase tracking-tight text-white">{ex?.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-white">{rec.weight}</span>
                      <span className="text-[9px] font-black text-zinc-800 ml-1 uppercase">KG</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Params */}
        <section>
          <div className="flex justify-between items-center mb-6 ml-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Konfiguracja Systemu</h4>
            <button onClick={() => setIsEditingGoals(!isEditingGoals)} className="text-orange-500 hover:text-white transition-colors">
              <Settings size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <GoalItem label="Kalorie" value={isEditingGoals ? tempGoals.calories : user.targetCalories} unit="kcal" isEditing={isEditingGoals} onChange={(v) => setTempGoals({...tempGoals, calories: Number(v)})} />
            <GoalItem label="Białko" value={isEditingGoals ? tempGoals.protein : user.targetProtein} unit="g" isEditing={isEditingGoals} onChange={(v) => setTempGoals({...tempGoals, protein: Number(v)})} />
            <GoalItem label="Węgle" value={isEditingGoals ? tempGoals.carbs : user.targetCarbs} unit="g" isEditing={isEditingGoals} onChange={(v) => setTempGoals({...tempGoals, carbs: Number(v)})} />
            <GoalItem label="Tłuszcz" value={isEditingGoals ? tempGoals.fat : user.targetFat} unit="g" isEditing={isEditingGoals} onChange={(v) => setTempGoals({...tempGoals, fat: Number(v)})} />
          </div>
          
          {isEditingGoals && (
            <button onClick={handleSaveGoals} className="w-full mt-4 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-xl">
              Zatwierdź Zmiany
            </button>
          )}
        </section>
      </div>

      <div className="mt-auto py-8 border-t border-zinc-900">
         <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 text-zinc-800 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.4em] transition-all">
            <LogOut size={16} /> Wyloguj
         </button>
      </div>
    </div>
  );
};

const GoalItem: React.FC<{ 
  label: string; 
  value: number; 
  unit: string; 
  isEditing: boolean;
  onChange: (val: string) => void;
}> = ({ label, value, unit, isEditing, onChange }) => (
  <div className={`bg-zinc-950 border p-5 rounded-[28px] transition-all ${isEditing ? 'border-orange-500/30 ring-1 ring-orange-500/10' : 'border-zinc-900'}`}>
    <p className="text-[8px] text-zinc-800 uppercase mb-2 font-black tracking-widest">{label}</p>
    {isEditing ? (
      <input type="number" value={value || ''} onChange={(e) => onChange(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl w-full px-3 py-2 text-xs font-black text-white focus:outline-none" />
    ) : (
      <p className="text-xl font-black text-white tracking-tighter">{value} <span className="text-[9px] text-zinc-800 font-bold ml-0.5 uppercase">{unit}</span></p>
    )}
  </div>
);

const ImageAdjuster: React.FC<{
  imageSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}> = ({ imageSrc, onConfirm, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => { imgRef.current = img; drawCanvas(); };
  }, [imageSrc]);

  useEffect(() => { drawCanvas(); }, [zoom, offset]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    const imgAspect = img.width / img.height;
    let dw, dh;
    if (imgAspect > 1) { dh = size * zoom; dw = dh * imgAspect; } 
    else { dw = size * zoom; dh = dw / imgAspect; }
    const bx = (size - dw) / 2; const by = (size - dh) / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.clip();
    ctx.drawImage(img, bx + offset.x, by + offset.y, dw, dh);
    ctx.restore();
  };

  const handleStart = (cx: number, cy: number) => { setIsDragging(true); setLastPos({ x: cx, y: cy }); };
  const handleMove = (cx: number, cy: number) => {
    if (!isDragging) return;
    const dx = cx - lastPos.x; const dy = cy - lastPos.y;
    setOffset(p => ({ x: p.x + dx, y: p.y + dy }));
    setLastPos({ x: cx, y: cy });
  };
  const handleEnd = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 bg-black/98 z-[120] flex flex-col p-8">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-lg font-black uppercase tracking-tighter">Profil Fotometrii</h3>
        <button onClick={onCancel} className="p-3 bg-zinc-900 rounded-full"><X size={24} /></button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <canvas 
          ref={canvasRef} width={400} height={400} 
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
          className="w-72 h-72 rounded-full bg-zinc-950 border-2 border-orange-500/20 cursor-move shadow-[0_0_40px_rgba(249,115,22,0.1)]"
        />
        <input 
          type="range" min="1" max="5" step="0.01" value={zoom} 
          onChange={e => setZoom(parseFloat(e.target.value))}
          className="w-full max-w-xs mt-12 accent-white"
        />
      </div>
      <button onClick={() => onConfirm(canvasRef.current!.toDataURL('image/png'))} className="w-full bg-white text-black py-6 rounded-3xl font-black text-sm uppercase tracking-widest mt-8">Zapisz Parametr</button>
    </div>
  );
};

export default ProfileView;
