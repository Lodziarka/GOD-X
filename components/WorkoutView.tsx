
import React, { useState, useMemo } from 'react';
import { WorkoutSession, WorkoutPlan, Exercise, PersonalRecord, SetLog, WorkoutExercise } from '../types';
import { EXERCISES } from '../constants';
import { Plus, Play, History, Trophy, Trash2, CheckCircle2, Info, X, Sparkles, Search } from 'lucide-react';

interface WorkoutViewProps {
  sessions: WorkoutSession[];
  setSessions: React.Dispatch<React.SetStateAction<WorkoutSession[]>>;
  plans: WorkoutPlan[];
  setPlans: React.Dispatch<React.SetStateAction<WorkoutPlan[]>>;
  records: PersonalRecord[];
  setRecords: React.Dispatch<React.SetStateAction<PersonalRecord[]>>;
}

interface SummaryData {
  session: WorkoutSession;
  newRecords: string[]; // exerciseIds
}

const WorkoutView: React.FC<WorkoutViewProps> = ({ sessions, setSessions, plans, setPlans, records, setRecords }) => {
  const [view, setView] = useState<'home' | 'plans' | 'active' | 'history' | 'summary'>('home');
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [showPlanCreator, setShowPlanCreator] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<Exercise | null>(null);

  const startWorkout = (plan: WorkoutPlan) => {
    const newSession: WorkoutSession = {
      id: Math.random().toString(36).substr(2, 9),
      planId: plan.id,
      name: plan.name,
      date: Date.now(),
      exercises: plan.exercises.map(exId => ({
        id: Math.random().toString(36).substr(2, 9),
        exerciseId: exId,
        sets: [{ weight: 0, reps: 0 }]
      }))
    };
    setActiveSession(newSession);
    setView('active');
  };

  const deletePlan = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Czy na pewno chcesz usunąć ten plan?')) {
      setPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  const addSet = (exerciseIndex: number) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    updated.exercises[exerciseIndex].sets.push({ weight: 0, reps: 0 });
    setActiveSession(updated);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    if (updated.exercises[exerciseIndex].sets.length > 1) {
      updated.exercises[exerciseIndex].sets.splice(setIndex, 1);
      setActiveSession(updated);
    }
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SetLog, value: number) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    updated.exercises[exerciseIndex].sets[setIndex][field] = value;
    setActiveSession(updated);
  };

  const finishWorkout = () => {
    if (!activeSession) return;
    
    const brokenRecords: string[] = [];
    const updatedRecords = [...records];

    activeSession.exercises.forEach(ex => {
      const maxWeightInSession = Math.max(...ex.sets.map(s => s.weight));
      if (maxWeightInSession <= 0) return;

      const existingRecordIndex = updatedRecords.findIndex(r => r.exerciseId === ex.exerciseId);
      
      if (existingRecordIndex > -1) {
        if (maxWeightInSession > updatedRecords[existingRecordIndex].weight) {
          updatedRecords[existingRecordIndex] = { 
            exerciseId: ex.exerciseId, 
            weight: maxWeightInSession, 
            date: Date.now() 
          };
          brokenRecords.push(ex.exerciseId);
        }
      } else {
        updatedRecords.push({ 
          exerciseId: ex.exerciseId, 
          weight: maxWeightInSession, 
          date: Date.now() 
        });
        brokenRecords.push(ex.exerciseId);
      }
    });
    
    setRecords(updatedRecords);
    setSessions(prev => [activeSession, ...prev]);
    setSummaryData({ session: activeSession, newRecords: brokenRecords });
    setActiveSession(null);
    setView('summary');
  };

  const createPlan = () => {
    if (!newPlanName || selectedExerciseIds.length === 0) return;
    const plan: WorkoutPlan = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlanName,
      exercises: selectedExerciseIds
    };
    setPlans(prev => [...prev, plan]);
    setNewPlanName('');
    setSearchQuery('');
    setSelectedExerciseIds([]);
    setShowPlanCreator(false);
  };

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return EXERCISES;
    const query = searchQuery.toLowerCase();
    return EXERCISES.filter(ex => 
      ex.name.toLowerCase().includes(query) || 
      ex.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // INFO MODAL
  const ExerciseInfoModal = () => {
    if (!selectedExerciseInfo) return null;
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
        <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl">
          <div className="relative aspect-square bg-zinc-900 overflow-hidden">
            {selectedExerciseInfo.imageUrl ? (
              <img 
                src={selectedExerciseInfo.imageUrl} 
                alt="Diagram anatomiczny" 
                className="w-full h-full object-cover transition-opacity duration-700 hover:opacity-100 opacity-90" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 bg-zinc-900">
                <Info size={40} className="mb-2 opacity-20" />
                <span className="text-[10px] uppercase tracking-widest font-bold">Brak diagramu</span>
              </div>
            )}
            
            <div className="absolute inset-0 pointer-events-none border-[12px] border-zinc-950/20"></div>
            <div className="absolute top-4 left-4 bg-orange-500/10 backdrop-blur-md border border-orange-500/30 px-3 py-1 rounded-full">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">ANATOMY SCAN</span>
            </div>

            <button 
              onClick={() => setSelectedExerciseInfo(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full text-white z-10 hover:bg-zinc-800 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
          </div>

          <div className="p-8 -mt-8 relative z-10 space-y-5 bg-zinc-950">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{selectedExerciseInfo.category}</span>
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{selectedExerciseInfo.name}</h3>
            </div>
            
            <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-zinc-400 text-sm leading-relaxed font-medium whitespace-pre-line">
                {selectedExerciseInfo.description || "Brak szczegółowego opisu dla tego ćwiczenia."}
              </p>
            </div>

            <button 
              onClick={() => setSelectedExerciseInfo(null)}
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-4 hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              ZAMKNIJ INSTRUKTAŻ
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'active' && activeSession) {
    return (
      <div className="space-y-6 pb-20 animate-in slide-in-from-bottom duration-300">
        <ExerciseInfoModal />
        <div className="flex justify-between items-center px-2">
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Aktywny trening</span>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{activeSession.name}</h2>
          </div>
          <button onClick={finishWorkout} className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">Zakończ</button>
        </div>
        
        {activeSession.exercises.map((ex, exIdx) => {
          const exerciseInfo = EXERCISES.find(e => e.id === ex.exerciseId);
          return (
            <div key={ex.id} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-zinc-100 flex items-center gap-2 text-lg">
                    {exerciseInfo?.name}
                    <button 
                      onClick={() => setSelectedExerciseInfo(exerciseInfo || null)}
                      className="text-orange-500/60 hover:text-orange-500 transition-colors p-1"
                    >
                      <Info size={16} />
                    </button>
                  </h3>
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{exerciseInfo?.category}</span>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                {ex.sets.map((set, sIdx) => (
                  <div key={sIdx} className="grid grid-cols-5 gap-3 items-center">
                    <span className="text-zinc-700 text-[10px] font-black uppercase tracking-tighter">SET {sIdx + 1}</span>
                    <div className="col-span-1 relative">
                       <input 
                        type="number" 
                        placeholder="kg"
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 text-center text-sm font-bold focus:border-white transition-colors outline-none"
                        value={set.weight || ''}
                        onChange={e => updateSet(exIdx, sIdx, 'weight', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1 relative">
                      <input 
                        type="number" 
                        placeholder="powt."
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 text-center text-sm font-bold focus:border-white transition-colors outline-none"
                        value={set.reps || ''}
                        onChange={e => updateSet(exIdx, sIdx, 'reps', Number(e.target.value))}
                      />
                    </div>
                    <div className="flex justify-end gap-2 col-span-2">
                      <button 
                        onClick={() => removeSet(exIdx, sIdx)} 
                        className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      {sIdx === ex.sets.length - 1 && (
                        <button onClick={() => addSet(exIdx)} className="w-10 h-10 bg-zinc-800 rounded-xl text-white hover:bg-zinc-700 flex items-center justify-center">
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (view === 'summary' && summaryData) {
    const totalVolume = summaryData.session.exercises.reduce((acc, ex) => 
      acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps), 0), 0
    );

    return (
      <div className="fixed inset-0 bg-black z-[70] flex flex-col p-6 animate-in zoom-in duration-300 overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center py-10">
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/40 animate-bounce">
            <Sparkles size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black text-center mb-2 uppercase tracking-tighter">TRENING UKOŃCZONY</h2>
          <p className="text-zinc-500 text-sm mb-8 text-center px-4 leading-tight">Twój upór buduje fundament potęgi.</p>

          <div className="w-full space-y-4 mb-10">
            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl flex justify-between items-center">
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Całkowita praca</span>
              <span className="text-3xl font-black text-white">{totalVolume.toLocaleString()} <span className="text-sm font-medium text-zinc-600 ml-1">KG</span></span>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest ml-4 mb-3">Statystyki ćwiczeń</h4>
              {summaryData.session.exercises.map(ex => {
                const exInfo = EXERCISES.find(e => e.id === ex.exerciseId);
                const isPR = summaryData.newRecords.includes(ex.exerciseId);
                const maxW = Math.max(...ex.sets.map(s => s.weight));
                return (
                  <div key={ex.id} className="bg-zinc-900/30 border border-zinc-800/40 p-5 rounded-3xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm flex items-center gap-2">
                        {exInfo?.name}
                        {isPR && <Trophy size={14} className="text-orange-500 fill-orange-500" />}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{ex.sets.length} SERII • MAX: {maxW}KG</p>
                    </div>
                    {isPR && (
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">Nowy Rekord</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button 
          onClick={() => { setView('home'); setSummaryData(null); }}
          className="w-full bg-white text-black py-6 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all mb-4 shadow-xl"
        >
          WRÓĆ DO BAZY
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ExerciseInfoModal />
      <div className="flex gap-4">
        <button 
          onClick={() => setView('home')} 
          className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === 'home' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          PLANY
        </button>
        <button 
          onClick={() => setView('history')} 
          className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          HISTORIA
        </button>
      </div>

      {view === 'home' && (
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-black uppercase tracking-tighter">Twoje systemy</h3>
            <button 
              onClick={() => { setShowPlanCreator(true); setSearchQuery(''); }}
              className="text-[10px] font-black text-orange-500 hover:text-white flex items-center gap-1.5 transition-colors uppercase tracking-widest border border-orange-500/20 px-3 py-1.5 rounded-full"
            >
              <Plus size={12} strokeWidth={3} /> DODAJ PLAN
            </button>
          </div>

          <div className="space-y-4">
            {plans.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-900 rounded-[40px] text-zinc-700">
                <p className="text-sm font-bold uppercase tracking-widest">Baza danych pusta</p>
                <p className="text-[10px] mt-2 opacity-50">Stwórz swój pierwszy plan treningowy</p>
              </div>
            ) : (
              plans.map(plan => (
                <div key={plan.id} className="bg-zinc-950 border border-zinc-900 p-6 rounded-[40px] flex justify-between items-center group hover:border-zinc-600 transition-all shadow-xl">
                  <div className="flex-1">
                    <h4 className="font-black text-xl uppercase tracking-tighter">{plan.name}</h4>
                    <p className="text-[10px] font-bold text-zinc-600 mt-1 uppercase tracking-widest">{plan.exercises.length} ĆWICZEŃ ZDEFINIOWANYCH</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => deletePlan(e, plan.id)}
                      className="p-3 text-zinc-800 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={20} />
                    </button>
                    <button 
                      onClick={() => startWorkout(plan)}
                      className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      <Play size={24} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {view === 'history' && (
        <section className="space-y-4">
          <h3 className="text-lg font-black uppercase tracking-tighter px-2">Logi operacyjne</h3>
          {sessions.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-900 rounded-[40px] text-zinc-700">
               <History size={32} className="mx-auto mb-3 opacity-20" />
               <p className="text-sm font-bold uppercase tracking-widest">Brak logów</p>
            </div>
          ) : (
            sessions.map(sess => (
              <div key={sess.id} className="bg-zinc-900/10 border border-zinc-900 p-5 rounded-3xl group hover:border-zinc-700 transition-colors">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-black text-lg uppercase tracking-tighter text-zinc-200">{sess.name}</h4>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-1">{new Date(sess.date).toLocaleDateString('pl-PL')}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-zinc-400">{sess.exercises.length} ĆWICZEŃ</p>
                   </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {showPlanCreator && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Konfigurator</h2>
            <button onClick={() => setShowPlanCreator(false)} className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white"><X size={24} /></button>
          </div>
          
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-700 uppercase tracking-widest ml-2">Identyfikator Planu</label>
              <input 
                type="text" 
                placeholder="np. PROTOKÓŁ PUSH" 
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-[32px] px-8 py-5 text-white focus:outline-none focus:border-orange-500 transition-colors font-bold"
                value={newPlanName}
                onChange={e => setNewPlanName(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-700 uppercase tracking-widest font-black ml-2">Wybór komponentów</label>
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                  <input 
                    type="text" 
                    placeholder="SZUKAJ ĆWICZENIA LUB KATEGORII..." 
                    className="w-full bg-zinc-900/30 border border-zinc-800/50 rounded-2xl pl-14 pr-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-zinc-600 transition-all placeholder:text-zinc-800"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-10 text-zinc-800 font-bold uppercase text-[10px] tracking-widest">
                    Brak wyników wyszukiwania
                  </div>
                ) : (
                  filteredExercises.map(ex => (
                    <div key={ex.id} className="flex gap-3">
                      <button 
                        onClick={() => {
                          if (selectedExerciseIds.includes(ex.id)) {
                            setSelectedExerciseIds(prev => prev.filter(id => id !== ex.id));
                          } else {
                            setSelectedExerciseIds(prev => [...prev, ex.id]);
                          }
                        }}
                        className={`flex-1 text-left p-5 rounded-[28px] border transition-all flex justify-between items-center ${
                          selectedExerciseIds.includes(ex.id) ? 'bg-orange-500 text-white border-transparent shadow-lg shadow-orange-500/20' : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tight">{ex.name}</span>
                          <span className={`text-[9px] uppercase tracking-widest font-bold mt-0.5 ${selectedExerciseIds.includes(ex.id) ? 'text-orange-100' : 'text-zinc-700'}`}>{ex.category}</span>
                        </div>
                        {selectedExerciseIds.includes(ex.id) && <CheckCircle2 size={20} strokeWidth={3} />}
                      </button>
                      <button 
                        onClick={() => setSelectedExerciseInfo(ex)}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded-[28px] flex items-center justify-center text-zinc-600 hover:text-orange-500 hover:border-orange-500/50 transition-all"
                      >
                        <Info size={24} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 sticky bottom-0 bg-black py-6">
            <button 
              onClick={createPlan}
              disabled={!newPlanName || selectedExerciseIds.length === 0}
              className="w-full bg-white text-black py-6 rounded-3xl font-black text-sm uppercase tracking-widest disabled:opacity-30 active:scale-95 transition-all shadow-2xl"
            >
              INICJUJ SYSTEM TRENINGOWY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutView;
