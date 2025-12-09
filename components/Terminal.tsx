
import React, { useState, useEffect, useRef } from 'react';
import GlitchText from './GlitchText';
import { Genre } from '../types';

interface TerminalProps {
  onGenerate: (prompt: string, genre: Genre) => void;
  onShowManifesto: () => void;
  isGenerating: boolean;
}

const Terminal: React.FC<TerminalProps> = ({ onGenerate, onShowManifesto, isGenerating }) => {
  const [input, setInput] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre>(Genre.POETRY);
  const [history, setHistory] = useState<string[]>([
    "سیستم نوتزریقی بارگذاری شد...",
    "ارتباط عصبی کُدَبیات برقرار است.",
    "برای شروع، یک کلمه یا مفهوم بنویسید.",
    "برای مشاهده مانیفست دستور 'درباره' را وارد کنید."
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const command = input.trim();

    if (command === 'درباره' || command === 'about' || command === 'help') {
        setHistory(prev => [...prev, `> ${command}`, "بازخوانی فایل مانیفست..."]);
        setTimeout(onShowManifesto, 500);
        setInput('');
        return;
    }

    setHistory(prev => [...prev, `> ${command}`, `در حال استخراج معنا [${selectedGenre}]...`, "تزریق به شبکه عصبی..."]);
    onGenerate(command, selectedGenre);
    setInput('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4" dir="rtl">
      
      {/* Genre Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-2">
        {Object.values(Genre).map((g) => (
            <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1 text-sm border transition-all duration-300 ${
                    selectedGenre === g 
                    ? 'bg-cyan-900/40 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                    : 'bg-black/40 border-gray-700 text-gray-500 hover:border-gray-500'
                }`}
            >
                {g}
            </button>
        ))}
      </div>

      <div className="w-full h-[55vh] flex flex-col text-sm md:text-base border border-gray-800 bg-black/90 rounded-lg shadow-2xl relative overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-3 z-20 text-right font-light tracking-wide">
          {history.map((line, i) => (
            <div key={i} className={`flex items-start gap-3 ${line.startsWith('>') ? 'text-white font-bold' : 'text-cyan-600/80'}`}>
              <span className="opacity-30 text-[10px] mt-1.5" dir="ltr">
                {new Date().toLocaleTimeString('fa-IR', {hour12: false, hour: '2-digit', minute:'2-digit'})}
              </span>
              <span>{line}</span>
            </div>
          ))}
          {isGenerating && (
               <div className="text-purple-400/80 animate-pulse flex items-center gap-2 pr-10">
                  <span>در حال پردازش کُدَبیات...</span>
                  <GlitchText text="[|||||]" intensity="medium" />
               </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-gray-900/30 border-t border-gray-800 z-20 flex items-center gap-3">
          <span className="text-cyan-500 font-bold animate-pulse">{'>'}</span>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="تزریق واژگان..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 font-normal"
            autoFocus
            disabled={isGenerating}
            autoComplete="off"
          />
          <button 
            type="submit"
            disabled={isGenerating}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 rounded transition-colors text-xs font-bold"
          >
            تزریق
          </button>
        </form>
      </div>
    </div>
  );
};

export default Terminal;
