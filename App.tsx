
import React, { useState, useEffect, useCallback } from 'react';
import { AppTab, User, Meal, WorkoutSession, PersonalRecord, WorkoutPlan, HealthStats } from './types';
import { INITIAL_USER } from './constants';
import DietView from './components/DietView';
import WorkoutView from './components/WorkoutView';
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import { Utensils, Calendar, User as UserIcon, Loader2, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DIET);
  const [showProfile, setShowProfile] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('gx_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });
  
  const [healthStats, setHealthStats] = useState<HealthStats>(() => {
    const saved = localStorage.getItem('gx_health');
    return saved ? JSON.parse(saved) : { steps: 0, activeCalories: 0, heartRate: 72, distance: 0, lastSync: Date.now() };
  });

  const [meals, setMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem('gx_meals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => {
    const saved = localStorage.getItem('gx_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [plans, setPlans] = useState<WorkoutPlan[]>(() => {
    const saved = localStorage.getItem('gx_plans');
    return saved ? JSON.parse(saved) : [];
  });

  const [records, setRecords] = useState<PersonalRecord[]>(() => {
    const saved = localStorage.getItem('gx_records');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const authStatus = localStorage.getItem('gx_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }

    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const triggerManualSync = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => {
      setHealthStats(prev => ({
        ...prev,
        steps: prev.steps + Math.floor(Math.random() * 50),
        activeCalories: prev.activeCalories + (Math.random() * 5),
        distance: prev.distance + (Math.random() * 0.1),
        lastSync: Date.now()
      }));
      setIsSyncing(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (user.connectedDevices && user.connectedDevices.length > 0) {
      const hrInterval = setInterval(() => {
        setHealthStats(prev => ({
          ...prev,
          heartRate: 65 + Math.floor(Math.random() * 25),
          lastSync: Date.now()
        }));
      }, 1000);

      const syncInterval = setInterval(() => {
        setIsSyncing(true);
        setTimeout(() => {
          setHealthStats(prev => ({
            ...prev,
            steps: prev.steps + Math.floor(Math.random() * 15),
            activeCalories: prev.activeCalories + (Math.random() * 1.5),
            distance: prev.distance + (Math.random() * 0.02),
            lastSync: Date.now()
          }));
          setIsSyncing(false);
        }, 1500);
      }, 15000);

      return () => {
        clearInterval(hrInterval);
        clearInterval(syncInterval);
      };
    }
  }, [user.connectedDevices?.length]);

  useEffect(() => {
    localStorage.setItem('gx_user', JSON.stringify(user));
    localStorage.setItem('gx_health', JSON.stringify(healthStats));
    localStorage.setItem('gx_meals', JSON.stringify(meals));
    localStorage.setItem('gx_sessions', JSON.stringify(sessions));
    localStorage.setItem('gx_plans', JSON.stringify(plans));
    localStorage.setItem('gx_records', JSON.stringify(records));
  }, [user, healthStats, meals, sessions, plans, records]);

  const handleLogin = () => {
    localStorage.setItem('gx_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('gx_authenticated');
    setIsAuthenticated(false);
    setShowProfile(false);
  };

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100]">
        <div className="relative mb-8">
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase animate-pulse">
            GOD <span className="text-orange-500">X</span>
          </h1>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
            <Loader2 size={24} className="text-zinc-800 animate-spin" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-8 text-center">Inicjalizacja Systemu Alpha</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 max-w-md mx-auto relative shadow-2xl overflow-hidden">
      <header className="px-6 py-6 flex justify-between items-center border-b border-zinc-900 sticky top-0 bg-black z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-white uppercase">GOD <span className="text-orange-500">X</span></h1>
          {isSyncing && (
            <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
               <RefreshCw size={10} className="text-orange-500 animate-spin" />
               <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">SYNCING</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => setShowProfile(true)}
          className="relative p-2.5 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-2xl transition-all active:scale-95"
        >
          {user.connectedDevices && user.connectedDevices.length > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-black" />
          )}
          <UserIcon size={18} className="text-zinc-400" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 px-6 pt-4">
        {activeTab === AppTab.DIET ? (
          <DietView meals={meals} user={user} setMeals={setMeals} healthStats={healthStats} />
        ) : (
          <WorkoutView 
            sessions={sessions} 
            setSessions={setSessions} 
            plans={plans} 
            setPlans={setPlans}
            records={records}
            setRecords={setRecords}
          />
        )}
      </main>

      {showProfile && (
        <ProfileView 
          user={user} 
          setUser={setUser} 
          records={records} 
          healthStats={healthStats}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
          onManualSync={triggerManualSync}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/80 backdrop-blur-xl border-t border-zinc-900 flex justify-around pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] z-30 px-6">
        <button 
          onClick={() => { setActiveTab(AppTab.DIET); setShowProfile(false); }}
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${activeTab === AppTab.DIET ? 'text-white' : 'text-zinc-600'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === AppTab.DIET ? 'bg-white/5 shadow-lg' : ''}`}>
             <Utensils size={22} strokeWidth={activeTab === AppTab.DIET ? 2.5 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Dieta</span>
        </button>
        <button 
          onClick={() => { setActiveTab(AppTab.WORKOUT); setShowProfile(false); }}
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all ${activeTab === AppTab.WORKOUT ? 'text-white' : 'text-zinc-600'}`}
        >
          <div className={`p-2 rounded-xl transition-all ${activeTab === AppTab.WORKOUT ? 'bg-white/5 shadow-lg' : ''}`}>
             <Calendar size={22} strokeWidth={activeTab === AppTab.WORKOUT ? 2.5 : 2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Trening</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
