import React, { useState, useEffect } from 'react';
import { AppTab, User, Meal, WorkoutSession, PersonalRecord, WorkoutPlan, HealthStats } from './types';
import { INITIAL_USER } from './constants';
import DietView from './components/DietView';
import WorkoutView from './components/WorkoutView';
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import { Utensils, Calendar, User as UserIcon, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DIET);
  const [showProfile, setShowProfile] = useState(false);
  
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('gx_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });
  
  const [healthStats] = useState<HealthStats>(() => {
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
    if (authStatus === 'true') setIsAuthenticated(true);
    const timer = setTimeout(() => setIsAppLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('gx_user', JSON.stringify(user));
    localStorage.setItem('gx_meals', JSON.stringify(meals));
    localStorage.setItem('gx_sessions', JSON.stringify(sessions));
    localStorage.setItem('gx_plans', JSON.stringify(plans));
    localStorage.setItem('gx_records', JSON.stringify(records));
  }, [user, meals, sessions, plans, records]);

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
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
          GOD <span className="text-orange-500">X</span>
        </h1>
        <Loader2 size={20} className="text-zinc-900 animate-spin mt-6" />
      </div>
    );
  }

  if (!isAuthenticated) return <AuthView onLogin={handleLogin} />;

  return (
    <div className="flex flex-col min-h-screen bg-black text-zinc-100 max-w-md mx-auto relative overflow-hidden font-['Inter']">
      <header className="px-6 py-8 flex justify-between items-center sticky top-0 bg-black z-20">
        <h1 className="text-lg font-black tracking-tight text-white uppercase">GOD <span className="text-orange-500">X</span></h1>
        <button onClick={() => setShowProfile(true)} className="p-2 transition-all active:scale-95">
          <UserIcon size={20} className="text-zinc-500" />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto pb-32 px-6">
        {activeTab === AppTab.DIET ? (
          <DietView meals={meals} user={user} setMeals={setMeals} healthStats={healthStats} />
        ) : (
          <WorkoutView sessions={sessions} setSessions={setSessions} plans={plans} setPlans={setPlans} records={records} setRecords={setRecords} />
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
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t border-zinc-900/50 flex justify-around pt-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] z-30 px-12">
        <button onClick={() => setActiveTab(AppTab.DIET)} className={`flex flex-col items-center gap-1 ${activeTab === AppTab.DIET ? 'text-white' : 'text-zinc-700'}`}>
          <Utensils size={20} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Dieta</span>
        </button>
        <button onClick={() => setActiveTab(AppTab.WORKOUT)} className={`flex flex-col items-center gap-1 ${activeTab === AppTab.WORKOUT ? 'text-white' : 'text-zinc-700'}`}>
          <Calendar size={20} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Trening</span>
        </button>
      </nav>
    </div>
  );
};

export default App;