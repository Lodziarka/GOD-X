
import React, { useState, useEffect } from 'react';
import { Meal, User, HealthStats } from '../types';
import { Plus, X, ScanLine, Activity, Footprints, HeartPulse, Zap, Search, Loader2, UtensilsCrossed, ChevronRight } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { GoogleGenAI } from "@google/genai";

interface DietViewProps {
  meals: Meal[];
  user: User;
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  healthStats: HealthStats;
}

interface SearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DietView: React.FC<DietViewProps> = ({ meals, user, setMeals, healthStats }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // baseProduct stores values per 100g to allow recalculation on weight change
  const [baseProduct, setBaseProduct] = useState<SearchResult | null>(null);
  const [newMeal, setNewMeal] = useState({ name: '', cals: '', p: '', c: '', f: '', weight: '100' });

  const today = new Date().setHours(0, 0, 0, 0);
  const todayMeals = meals.filter(m => new Date(m.timestamp).setHours(0, 0, 0, 0) === today);

  const totals = todayMeals.reduce((acc, curr) => ({
    cals: acc.cals + curr.calories,
    p: acc.p + curr.protein,
    c: acc.c + curr.carbs,
    f: acc.f + curr.fat,
  }), { cals: 0, p: 0, c: 0, f: 0 });

  const adjustedTarget = user.targetCalories + Math.round(healthStats.activeCalories);
  const remaining = Math.max(0, adjustedTarget - Math.round(totals.cals));
  const progressPercent = (totals.cals / adjustedTarget) * 100;
  const progressDisplay = Math.min(progressPercent, 100);

  let barColor = "bg-white";
  let shadowColor = "shadow-[0_0_15px_rgba(255,255,255,0.5)]";
  if (progressPercent >= 90 && progressPercent < 105) {
    barColor = "bg-orange-500";
    shadowColor = "shadow-[0_0_15px_rgba(249,115,22,0.6)]";
  } else if (progressPercent >= 105) {
    barColor = "bg-red-600";
    shadowColor = "shadow-[0_0_15px_rgba(220,38,38,0.6)]";
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Działaj jako baza danych produktów spożywczych Fitatu. Znajdź listę 5 produktów pasujących do: "${searchQuery}". Dla każdego podaj wartości na 100g. Zwróć JSON: Array<{name: string, calories: number, protein: number, carbs: number, fat: number}>. Używaj polskich nazw. Tylko czysty JSON.`,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setSearchResults(data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectProduct = (prod: SearchResult) => {
    setBaseProduct(prod);
    setNewMeal({
      name: prod.name,
      cals: prod.calories.toString(),
      p: prod.protein.toString(),
      c: prod.carbs.toString(),
      f: prod.fat.toString(),
      weight: '100'
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleWeightChange = (weightStr: string) => {
    const weight = parseFloat(weightStr);
    setNewMeal(prev => {
      const updated = { ...prev, weight: weightStr };
      if (baseProduct && !isNaN(weight)) {
        const ratio = weight / 100;
        updated.cals = (baseProduct.calories * ratio).toFixed(0);
        updated.p = (baseProduct.protein * ratio).toFixed(1);
        updated.c = (baseProduct.carbs * ratio).toFixed(1);
        updated.f = (baseProduct.fat * ratio).toFixed(1);
      }
      return updated;
    });
  };

  const addMeal = () => {
    if (!newMeal.name || !newMeal.cals) return;
    const meal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${newMeal.name} (${newMeal.weight}g)`,
      calories: Math.round(Number(newMeal.cals)),
      protein: Number(newMeal.p),
      carbs: Number(newMeal.c),
      fat: Number(newMeal.f),
      timestamp: Date.now()
    };
    setMeals(prev => [meal, ...prev]);
    setNewMeal({ name: '', cals: '', p: '', c: '', f: '', weight: '100' });
    setBaseProduct(null);
    setShowAdd(false);
  };

  const handleScanResult = (result: any) => {
    const prod: SearchResult = {
      name: result.name,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat
    };
    selectProduct(prod);
    setShowAdd(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Section */}
      <section className="bg-zinc-950 border border-zinc-900 rounded-[40px] p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 h-2 bg-zinc-900/50 w-full overflow-hidden">
           <div className={`h-full ${barColor} transition-all duration-1000 ease-out ${shadowColor}`} style={{ width: `${progressDisplay}%` }} />
        </div>
        <div className="flex justify-between items-start mb-10 mt-2">
          <div>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Energia Systemu</p>
            <h2 className="text-5xl font-black tracking-tighter text-white">
              {Math.round(totals.cals)} 
              <span className="text-zinc-800 text-xl font-bold ml-2">/ {adjustedTarget}</span>
            </h2>
          </div>
          <div className="text-right">
             <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Dostępne</p>
             <p className={`text-2xl font-black tracking-tighter ${remaining === 0 && totals.cals > adjustedTarget ? 'text-red-500' : 'text-orange-500'}`}>{remaining}</p>
             <p className="text-[8px] text-zinc-700 font-bold uppercase">KCAL</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MacroPill label="Białko" current={totals.p} target={user.targetProtein} />
          <MacroPill label="Węgle" current={totals.c} target={user.targetCarbs} />
          <MacroPill label="Tłuszcz" current={totals.f} target={user.targetFat} />
        </div>
      </section>

      {/* Health Stats */}
      <section className="bg-zinc-900/10 border border-zinc-900 rounded-[32px] p-6 flex justify-between items-center group overflow-hidden relative shadow-lg">
         <div className="flex gap-8 relative z-10">
            <HealthIndicator icon={<Footprints size={16} />} label="Kroki" value={healthStats.steps.toLocaleString()} />
            <HealthIndicator icon={<HeartPulse size={16} className="text-red-500 animate-pulse" />} label="Tętno" value={`${healthStats.heartRate} BPM`} />
            <HealthIndicator icon={<Zap size={16} className="text-orange-500" />} label="Spalone" value={`${Math.round(healthStats.activeCalories)} kcal`} />
         </div>
         <Activity className="absolute -right-4 -bottom-4 text-white/[0.02] scale-[3]" size={60} />
      </section>

      {/* Meal List Control */}
      <section className="pt-2">
        <div className="flex justify-between items-center mb-6 px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">Paliwo Dnia</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowScanner(true)} className="w-12 h-12 bg-zinc-950 border border-zinc-900 text-orange-500 rounded-2xl flex items-center justify-center hover:bg-zinc-900 active:scale-95 transition-all shadow-lg">
              <ScanLine size={20} />
            </button>
            <button onClick={() => { setShowAdd(true); setSearchResults([]); setBaseProduct(null); }} className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center hover:bg-orange-500 hover:text-white active:scale-95 transition-all shadow-lg">
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {todayMeals.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-zinc-900 rounded-[40px] text-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Oczekuję na dane...</p>
            </div>
          ) : (
            todayMeals.map(meal => (
              <div key={meal.id} className="bg-zinc-950 border border-zinc-900 p-6 rounded-[32px] flex justify-between items-center group hover:border-zinc-700 transition-all">
                <div>
                  <h4 className="font-black text-xs uppercase tracking-widest text-white">{meal.name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-black text-orange-500">{meal.calories}</span>
                    <span className="text-[8px] font-bold text-zinc-700 uppercase">KCAL</span>
                    <span className="w-1 h-1 bg-zinc-800 rounded-full mx-1"></span>
                    <span className="text-[9px] text-zinc-600 font-medium uppercase tracking-tighter">B:{meal.protein} W:{meal.carbs} T:{meal.fat}</span>
                  </div>
                </div>
                <button onClick={() => setMeals(prev => prev.filter(m => m.id !== meal.id))} className="p-3 bg-zinc-900 rounded-xl opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all">
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {showScanner && <BarcodeScanner onScanResult={handleScanResult} onClose={() => setShowScanner(false)} />}

      {/* Add Meal Overlay */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[100] flex flex-col animate-in slide-in-from-bottom duration-300 overflow-y-auto pb-safe">
          <div className="p-6 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-md z-10">
             <h3 className="text-2xl font-black uppercase tracking-tighter">Baza Produktów</h3>
             <button onClick={() => setShowAdd(false)} className="p-3 bg-zinc-900 rounded-full"><X size={20} /></button>
          </div>

          <div className="px-6 space-y-8 pb-10">
            {/* Search Bar */}
            <div className="relative">
              <input 
                type="text" 
                placeholder="SZUKAJ PRODUKTU (NP. TWARÓG CHUDY)..." 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl pl-14 pr-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-orange-500 transition-all uppercase"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
              <button 
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-orange-500 text-white p-2 rounded-xl"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Wyniki wyszukiwania</p>
                {searchResults.map((res, i) => (
                  <button 
                    key={i} 
                    onClick={() => selectProduct(res)}
                    className="w-full bg-zinc-900/40 border border-zinc-800 p-5 rounded-[28px] flex justify-between items-center hover:border-orange-500/50 transition-all text-left"
                  >
                    <div>
                      <p className="font-black text-xs uppercase tracking-tight text-white">{res.name}</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">B:{res.protein} W:{res.carbs} T:{res.fat} / 100G</p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-orange-500">{res.calories} kcal</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Manual Form */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-[40px] p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4">Wybrany produkt / Nazwa</label>
                <input type="text" placeholder="NP. KURCZAK Z RYŻEM" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-xs font-bold text-white focus:outline-none focus:border-orange-500 transition-colors uppercase" value={newMeal.name} onChange={e => setNewMeal({...newMeal, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4">Ilość (Gramy)</label>
                  <input type="number" placeholder="100" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-black focus:outline-none focus:border-orange-500 text-orange-500" value={newMeal.weight} onChange={e => handleWeightChange(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest ml-4">Kalorie (Wyliczone)</label>
                  <input type="number" placeholder="0" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-sm font-black focus:outline-none" value={newMeal.cals} onChange={e => setNewMeal({...newMeal, cals: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center block">Białko</label>
                  <input type="number" placeholder="0" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-center text-xs font-black" value={newMeal.p} onChange={e => setNewMeal({...newMeal, p: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center block">Węgle</label>
                  <input type="number" placeholder="0" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-center text-xs font-black" value={newMeal.c} onChange={e => setNewMeal({...newMeal, c: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center block">Tłuszcz</label>
                  <input type="number" placeholder="0" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2 py-3 text-center text-xs font-black" value={newMeal.f} onChange={e => setNewMeal({...newMeal, f: e.target.value})} />
                </div>
              </div>

              <button 
                onClick={addMeal} 
                disabled={!newMeal.name || !newMeal.cals}
                className="w-full bg-white text-black py-5 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-xl disabled:opacity-20"
              >
                Autoryzuj i Dodaj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MacroPill: React.FC<{ label: string, current: number, target: number }> = ({ label, current, target }) => (
  <div className="bg-zinc-900/20 rounded-[24px] p-4 border border-zinc-900">
    <p className="text-[8px] text-zinc-700 uppercase tracking-[0.2em] mb-2 font-black">{label}</p>
    <div className="flex items-baseline gap-1">
      <span className="text-sm font-black text-white">{Math.round(current)}<span className="text-[8px] text-zinc-600 ml-0.5">G</span></span>
    </div>
    <div className="mt-3 h-1 bg-zinc-900 rounded-full overflow-hidden">
      <div className="h-full bg-white transition-all duration-500 shadow-[0_0_5px_white]" style={{ width: `${Math.min((current/target)*100, 100)}%` }} />
    </div>
  </div>
);

const HealthIndicator: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 mb-0.5">
      <span className="text-zinc-500">{icon}</span>
      <span className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-[11px] font-black text-zinc-100 uppercase tracking-tighter">{value}</span>
  </div>
);

export default DietView;
