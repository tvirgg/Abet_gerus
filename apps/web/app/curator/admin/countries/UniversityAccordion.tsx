"use client";
import { useState, useRef, useEffect } from "react";
import { University, Program } from "../../../../shared/CountryContext";

type Props = {
  university: University;
  programs: Program[];
  onSelectProgram: (program: Program) => void;
  onEditProgram: (program: Program) => void; // Для быстрого редактирования из списка
  onDeleteProgram: (id: number) => void;
};

// Функция группировки программ по категориям
const groupPrograms = (programs: Program[]) => {
  const groups: Record<string, Program[]> = {};
  programs.forEach(p => {
    const cat = p.category || "Общее";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  
  // Сортировка программ внутри групп A-Z
  Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.title.localeCompare(b.title));
  });
  
  return groups;
};

export default function UniversityAccordion({ university, programs, onSelectProgram, onEditProgram, onDeleteProgram }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState("0px");

  const groupedPrograms = groupPrograms(programs);
  const categories = Object.keys(groupedPrograms).sort();

  useEffect(() => {
      // Динамический расчет высоты для анимации
      if (isOpen && contentRef.current) {
          setHeight(`${contentRef.current.scrollHeight}px`);
      } else {
          setHeight("0px");
      }
  }, [isOpen, programs]); // Пересчитываем при открытии или изменении программ

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 transition-all hover:border-zinc-400 dark:hover:border-zinc-600 mb-2">
      {/* Header Аккордеона */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
      >
        <div className="flex items-center gap-3">
             <span className="text-xl">{university.logo_url}</span>
             <div>
                 <div className="font-semibold text-sm">{university.name}</div>
                 <div className="text-xs text-zinc-500">{programs.length} программ</div>
             </div>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
            ▼
        </div>
      </button>

      {/* Выпадающий контент */}
      <div 
        style={{ maxHeight: height, opacity: isOpen ? 1 : 0 }}
        className="transition-all duration-300 ease-in-out overflow-hidden bg-zinc-50 dark:bg-zinc-900/50"
        ref={contentRef}
      >
         <div className="p-3 pt-0">
            {programs.length === 0 ? (
                <p className="text-xs text-zinc-400 p-2 italic">Нет добавленных программ</p>
            ) : (
                <div className="space-y-4 mt-2">
                    {categories.map(cat => (
                        <div key={cat}>
                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 ml-1">{cat}</h4>
                            <ul className="space-y-1">
                                {groupedPrograms[cat].map(prog => (
                                    <li key={prog.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition cursor-pointer"
                                        onClick={() => onSelectProgram(prog)}
                                    >
                                        <span className="text-sm truncate pr-2">{prog.title}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onEditProgram(prog); }} 
                                                className="text-xs text-blue-500 hover:underline"
                                            >
                                                Ред
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteProgram(prog.id); }} 
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Удал
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Кнопка добавления программы прямо в этот вуз (опционально можно добавить) */}
         </div>
      </div>
    </div>
  );
}
