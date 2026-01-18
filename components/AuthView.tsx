
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface AuthViewProps {
  onLogin: () => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-8 max-w-md mx-auto">
      <div className="mt-20 mb-12">
        <h1 className="text-5xl font-medium tracking-tight mb-2 uppercase">GOD <span className="text-orange-500">X</span></h1>
        <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Twoje miejsce do sukcesu.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold ml-1">Adres Email</label>
          <input 
            type="email" 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
            placeholder="example@godx.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold ml-1">Hasło</label>
          <input 
            type="password" 
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-white transition-all placeholder:text-zinc-700"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-white text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all mt-8"
        >
          {isRegistering ? 'Stwórz Konto' : 'Zaloguj Się'} <ArrowRight size={18} />
        </button>
      </form>

      <div className="mt-auto pt-10 text-center">
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-zinc-600 text-xs font-medium hover:text-white transition-colors"
        >
          {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Dołącz teraz'}
        </button>
      </div>
    </div>
  );
};

export default AuthView;
