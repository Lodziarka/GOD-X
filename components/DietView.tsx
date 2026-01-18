import React, { useState } from 'react';
import { Meal, User, HealthStats } from '../types';
import { Plus, X, ScanLine, Search, Loader2, ChevronRight } from 'lucide-react';
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Działaj jako minimalistyczna baza produktów. Znajdź listę 5 produktów pasujących do: "${searchQuery}". Wartości na 100g. Zwróć JSON: Array<{name: string, calories: number, protein: number, carbs: number, fat: number}>. Polski język.`,
        config: { responseMimeType: "application/json" }
      });
      const data = JSON.parse(response.text);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addMeal = () => {
    if (!newMeal.name || !newMeal.cals) return;
    const meal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      name: newMeal.name,
      calories: Math.round(Number(newMeal.cals)),
      protein: Number(newMeal.p) || 0,
      carbs: Number(newMeal.c) || 0,
      fat: Number(newMeal.f) || 0,
      timestamp: Date.now()
    };
    setMeals(prev => [meal, ...prev]);
    setShowAdd(false);
    setNewMeal({ name: '', cals: '', p: '', c: '', f: '', weight: '100' });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <section className="pt-4">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Energia Pozostała</p>
        <div className="flex items-baseline gap-3">
          <h2 className="text-7xl font-black tracking-tighter text-white">{remaining}</h2>
          <span className="text-zinc-800 text-xl font-bold uppercase tracking-widest">Kcal</span>
        </div>
        <div className="grid grid-cols-3 gap-6 mt-10">
          <SimpleMacro label="Białko" val={totals.p} />
          <SimpleMacro label="Węgle" val={totals.c} />
          <SimpleMacro label="Tłuszcz" val={totals.f} />
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Paliwo</h3>
          <div className="flex gap-4">
            <button onClick={() => setShowScanner(true)} className="text-zinc-500 hover:text-orange-500 transition-colors">
              <ScanLine size={18} />
            </button>
            <button onClick={() => setShowAdd(true)} className="text-zinc-500 hover:text-white transition-colors">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {todayMeals.length === 0 ? (
            <p className="text-zinc-900 text-[10px] font-bold uppercase tracking-widest py-10">System gotowy do logowania.</p>
          ) : (
            todayMeals.map(meal => (
              <div key={meal.id} className="flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-tight text-zinc-300">{meal.name}</h4>
                  <p className="text-[10px] font-medium text-zinc-600 mt-1 uppercase">
                    {meal.calories} kcal • {meal.protein}b {meal.carbs}w {meal.fat}t
                  </p>
                </div>
                <button onClick={() => setMeals(prev => prev.filter(m => m.id !== meal.id))} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-800 hover:text-red-500 transition-all">
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {showScanner && <BarcodeScanner onScanResult={(r) => { setNewMeal({name: r.name, cals: String(r.calories), p: String(r.protein), c: String(r.carbs), f: String(r.fat), weight: '100'}); setShowAdd(true); setShowScanner(false); }} onClose={() => setShowScanner(false)} />}

      {showAdd && (
        <div className="fixed inset-0 bg-black z-[100] p-8 flex flex-col animate-in slide-in-from-bottom duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-lg font-black uppercase tracking-widest">Dodaj wpis</h3>
            <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Szukaj produktu..." 
                className="w-full bg-transparent border-b border-zinc-900 py-4 text-sm font-bold text-white focus:outline-none focus:border-orange-500 transition-all uppercase placeholder:text-zinc-800"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-700">
                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4 pt-4">
                {searchResults.map((res, i) => (
                  <button key={i} onClick={() => { setNewMeal({name: res.name, cals: String(res.calories), p: String(res.protein), c: String(res.carbs), f: String(res.fat), weight: '100'}); setSearchResults([]); }} className="w-full flex justify-between items-center py-3 border-b border-zinc-900/50 text-left">
                    <span className="text-[10px] font-black uppercase tracking-tight text-zinc-400">{res.name}</span>
                    <span className="text-[10px] font-black text-orange-500">{res.calories} kcal</span>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-12 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <InputGroup label="Nazwa" val={newMeal.name} onChange={v => setNewMeal({...newMeal, name: v})} />
                <InputGroup label="Kalorie" val={newMeal.cals} onChange={v => setNewMeal({...newMeal, cals: v})} />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <InputGroup label="B" val={newMeal.p} onChange={v => setNewMeal({...newMeal, p: v})} />
                <InputGroup label="W" val={newMeal.c} onChange={v => setNewMeal({...newMeal, c: v})} />
                <InputGroup label="T" val={newMeal.f} onChange={v => setNewMeal({...newMeal, f: v})} />
              </div>

              <button 
                onClick={addMeal}
                className="w-full bg-white text-black py-5 mt-8 rounded-full font-black text-[10px] uppercase tracking-[0.4em] active:scale-95 transition-all"
              >
                Loguj Dane
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SimpleMacro: React.FC<{ label: string, val: number }> = ({ label, val }) => (
  <div>
    <p className="text-[8px] font-black text-zinc-800 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xl font-black text-zinc-200 tracking-tighter">{Math.round(val)}<span className="text-[9px] text-zinc-800 ml-0.5">G</span></p>
  </div>
);

const InputGroup: React.FC<{ label: string, val: string, onChange: (v: string) => void }> = ({ label, val, onChange }) => (
  <div className="space-y-1">
    <label className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">{label}</label>
    <input 
      type="text" 
      className="w-full bg-transparent border-b border-zinc-900 py-2 text-xs font-bold text-white focus:outline-none focus:border-zinc-500 transition-all uppercase"
      value={val}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

export default DietView;