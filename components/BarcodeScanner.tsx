
import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Loader2, Zap, Eye, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface BarcodeScannerProps {
  onScanResult: (result: { name: string; calories: number; protein: number; carbs: number; fat: number }) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanResult, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    startCamera();
    const timer = window.setTimeout(() => {
      startAutoScanLoop();
    }, 2000);

    return () => {
      stopCamera();
      if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
      clearTimeout(timer);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Brak dostępu do wizjera systemowego. Sprawdź uprawnienia kamery.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const analyzeFrame = async (isManual = false) => {
    if (!videoRef.current || !canvasRef.current || isAnalyzingRef.current) return;
    
    // Safety check: ensure video is actually playing and has dimensions
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) return;

    isAnalyzingRef.current = true;
    if (isManual) setLoading(true);
    setIsAutoScanning(true);
    setError(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64Image = dataUrl.split(',')[1];

      if (!base64Image) {
        isAnalyzingRef.current = false;
        return;
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
              { text: "Działaj jako skaner GOD X. Zidentyfikuj produkt spożywczy lub kod kreskowy. Jeśli widzisz tabelę wartości odżywczych, odczytaj ją. Zwróć dane w formacie JSON: { 'name': string, 'calories': number, 'protein': number, 'carbs': number, 'fat': number }. Wartości dla 100g lub porcji. Jeśli nie widzisz produktu, zwróć pusty obiekt {}. Nazwa po polsku. Tylko czysty JSON bez formatowania markdown." }
            ]
          },
          config: {
            responseMimeType: "application/json"
          }
        });

        const textResult = response.text;
        if (textResult) {
          const data = JSON.parse(textResult.trim());
          
          if (data.name && data.calories !== undefined) {
            if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
            onScanResult(data);
            onClose();
          }
        }
      } catch (err: any) {
        console.error("Vision AI Error:", err);
        // Only show error UI for manual attempts to avoid flickering on auto-scans
        if (isManual) {
          setError(err.message?.includes("400") 
            ? "Błąd formatu obrazu. Spróbuj zmienić oświetlenie." 
            : "Wystąpił błąd podczas analizy Vision AI.");
        }
      } finally {
        isAnalyzingRef.current = false;
        if (isManual) setLoading(false);
        setIsAutoScanning(false);
      }
    }
  };

  const startAutoScanLoop = () => {
    if (scanIntervalRef.current) return;
    scanIntervalRef.current = window.setInterval(() => {
      analyzeFrame(false);
    }, 4000); // Increased interval slightly for better reliability
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted
          className="h-full w-full object-cover opacity-90 scale-[1.02]"
        />
        
        {/* VISION UI OVERLAY */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="w-72 h-72 relative">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-[6px] border-l-[6px] border-orange-500 rounded-tl-2xl shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-[6px] border-r-[6px] border-orange-500 rounded-tr-2xl shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[6px] border-l-[6px] border-orange-500 rounded-bl-2xl shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[6px] border-r-[6px] border-orange-500 rounded-br-2xl shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            
            <div className={`absolute left-0 w-full h-1 bg-orange-500/60 shadow-[0_0_20px_rgba(249,115,22,0.8)] transition-all duration-[3000ms] ease-in-out ${isAutoScanning ? 'top-full opacity-100' : 'top-0 opacity-20'}`} />
            
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
               <Eye size={120} className="text-white" strokeWidth={1} />
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
               <div className={`w-2 h-2 rounded-full ${isAutoScanning ? 'bg-orange-500 animate-ping' : 'bg-green-500'}`} />
               <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em]">
                 {isAutoScanning ? 'Analiza Vision AI...' : 'Wizjer aktywny'}
               </span>
            </div>
            <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-2">Umieść produkt w ramce</p>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
           <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-orange-500 animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">GOD X VISION V2.1</span>
           </div>
           <button 
            onClick={onClose}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-20 animate-in fade-in duration-300">
            <div className="relative">
              <Loader2 size={64} className="text-orange-500 animate-spin mb-4" />
              <Zap size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" />
            </div>
            <h3 className="text-xl font-black tracking-tighter text-white mt-4 uppercase">PRZECHWYTYWANIE DANYCH</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Synchronizacja z bazą makroskładników</p>
          </div>
        )}
      </div>

      <div className="bg-black p-10 flex flex-col items-center border-t border-zinc-900 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => analyzeFrame(true)}
          disabled={loading || isAutoScanning}
          className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 ${loading ? 'border-zinc-800' : 'border-zinc-800 hover:border-orange-500'}`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all ${loading ? 'bg-zinc-900' : 'bg-white group-hover:bg-orange-500'}`}>
             <Zap size={36} className={`transition-colors ${loading ? 'text-zinc-700' : 'text-black fill-black'}`} />
          </div>
        </button>
        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-6">Skanowanie wymuszone</p>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="absolute bottom-40 left-6 right-6 bg-red-500/20 border border-red-500/50 p-5 rounded-2xl text-center backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
          <p className="text-red-200 text-xs font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
