"use client";
import { useEffect, useState, useMemo } from "react";
import { useCountry, Program } from "../../../../shared/CountryContext";
import ProgramEditModal from "./ProgramEditModal";
import UniversityAccordion from "./UniversityAccordion";
// import ProgramDetailModal from "./ProgramDetailModal"; // Больше не нужен
import CountryDetailPanel from "./CountryDetailPanel";
import ProgramDetailPanel from "./ProgramDetailPanel"; // <--- Импортируем новый компонент

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function ConfiguratorPage() {
  const { countries, universities, refreshData, quests } = useCountry();
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  
  // Состояние
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  
  // Модальные окна
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  
  // Вместо модалки для просмотра, используем состояние для панели
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [activeUniversityIdForCreate, setActiveUniversityIdForCreate] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false); // Для создания страны


  // Инициализация страны (выбираем первую по умолчанию)
  useEffect(() => {
      if (countries.length > 0 && !selectedCountryId) {
          setSelectedCountryId(countries[0].id);
      }
  }, [countries]);

  // При смене страны сбрасываем выбранную программу
  useEffect(() => {
      setViewingProgram(null);
  }, [selectedCountryId]);

  const activeCountry = useMemo(() => 
    countries.find(c => c.id === selectedCountryId), 
  [countries, selectedCountryId]);

  // Загрузка программ
  useEffect(() => {
      if (selectedCountryId) {
          setLoadingPrograms(true);
          const token = localStorage.getItem("accessToken");
          fetch(`${API_URL}/admin/programs/search?countryId=${selectedCountryId}`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          .then(async (res) => {
              if (res.ok) {
                  const data = await res.json();
                  setPrograms(Array.isArray(data) ? data : []);
              }
          })
          .finally(() => setLoadingPrograms(false));
      }
  }, [selectedCountryId]);

  const filteredUniversities = useMemo(() => {
      return universities.filter((u: any) => u.countryId === selectedCountryId);
  }, [universities, selectedCountryId]);

  // --- CRUD Actions ---
  const handleSaveProgram = async (data: any) => {
      const token = localStorage.getItem("accessToken");
      const method = data.id ? "PATCH" : "POST";
      const url = data.id ? `${API_URL}/admin/programs/${data.id}` : `${API_URL}/admin/programs`;
      
      const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(data)
      });
      
      if (res.ok) {
           const resP = await fetch(`${API_URL}/admin/programs/search?countryId=${selectedCountryId}`, {
              headers: { Authorization: `Bearer ${token}` }
           });
           const updatedPrograms = await resP.json();
           setPrograms(updatedPrograms);
           
           // Если мы редактировали текущую просматриваемую программу, обновим её данные в панели
           if (viewingProgram && data.id) {
               const updatedCurrent = updatedPrograms.find((p: any) => p.id === data.id);
               if (updatedCurrent) setViewingProgram(updatedCurrent);
           }
      }
  };

  const handleDeleteProgram = async (id: number) => {
       if(!confirm("Удалить программу?")) return;
       const token = localStorage.getItem("accessToken");
       await fetch(`${API_URL}/admin/programs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
       setPrograms(prev => prev.filter(p => p.id !== id));
       if (viewingProgram?.id === id) setViewingProgram(null);
  };
  
  const saveTaskTemplate = async (task: any) => {
    const token = localStorage.getItem("accessToken");
    const payload = { ...task, countryId: selectedCountryId };
    if (task.id < 0) delete payload.id;
    await fetch(`${API_URL}/admin/task-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    await refreshData();
  };

  const deleteTaskTemplate = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    await fetch(`${API_URL}/admin/task-templates/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await refreshData();
  };

  // Создание страны
  const handleCreateCountry = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const token = localStorage.getItem("accessToken");
      await fetch(`${API_URL}/admin/countries`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id: formData.get("id"), name: formData.get("name"), flagIcon: formData.get("flag") })
      });
      await refreshData();
      setIsCountryModalOpen(false);
  };


  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-semibold">База знаний</h1>
        <p className="text-zinc-500 text-sm">Настройка стран, университетов и образовательных треков.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_380px] gap-6 flex-1 overflow-hidden">
        
        {/* Колонка 1: Страны (Сайдбар навигации) */}
        <div className="card flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
             <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Страны</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
                {countries.map((c: any) => (
                <li key={c.id}>
                    <button
                    onClick={() => setSelectedCountryId(c.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm flex items-center justify-between group ${
                        selectedCountryId === c.id 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="text-lg leading-none">{c.flag_icon}</span> 
                            <span className="font-medium">{c.name}</span>
                        </span>
                        {selectedCountryId === c.id && <span className="text-xs opacity-70">●</span>}
                    </button>
                </li>
                ))}
            </ul>
          </div>
          <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
            <button 
                onClick={() => setIsCountryModalOpen(true)}
                className="w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-500 hover:border-blue-500 hover:text-blue-500 transition"
            >
                + Добавить страну
            </button>
          </div>

        </div>

        {/* Колонка 2: Университеты (Центральная область) */}
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0 px-1">
                 <div>
                     <h2 className="font-bold text-lg flex items-center gap-2">
                        {activeCountry?.flag_icon} {activeCountry?.name}
                        <span className="text-zinc-400 font-normal text-sm">/ Университеты</span>
                     </h2>
                 </div>
                 <button className="text-xs bg-zinc-900 text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium">
                     + Добавить ВУЗ
                 </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredUniversities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <div className="text-3xl mb-2 opacity-50">🏛️</div>
                        <p>В этой стране пока нет университетов</p>
                    </div>
                ) : (
                    <div className="space-y-4 pb-10">
                        {filteredUniversities.map((uni: any) => (
                            <UniversityAccordion
                                key={uni.id}
                                university={uni}
                                programs={programs.filter(p => p.university_id === uni.id || (p as any).universityId === uni.id)}
                                onSelectProgram={(p) => setViewingProgram(p)}
                                onEditProgram={(p) => { setEditingProgram(p); setActiveUniversityIdForCreate(uni.id); setIsProgramModalOpen(true); }}
                                onDeleteProgram={handleDeleteProgram}
                            />
                        ))}
                        <div className="h-4"></div> {/* Spacer */}
                    </div>
                )}
            </div>
        </div>

        {/* Колонка 3: Детали (Сменная панель: Страна или Программа) */}
        <div className="h-full overflow-hidden">
            {viewingProgram ? (
                <ProgramDetailPanel 
                    program={viewingProgram}
                    onClose={() => setViewingProgram(null)}
                    onEdit={() => {
                        setEditingProgram(viewingProgram);
                        setActiveUniversityIdForCreate(viewingProgram.university_id || (viewingProgram as any).universityId);
                        setIsProgramModalOpen(true);
                    }}
                />
            ) : (
                <CountryDetailPanel
                    countryId={selectedCountryId || ""}
                    onSaveTask={saveTaskTemplate}
                    onDeleteTask={deleteTaskTemplate}
                 />
            )}
         </div>
      </div>
      
      {/* Modals */}
      {isProgramModalOpen && activeUniversityIdForCreate && (
        <ProgramEditModal
            program={editingProgram}
            universityId={activeUniversityIdForCreate}
            onSave={handleSaveProgram}
            onClose={() => setIsProgramModalOpen(false)}
        />
      )}

      {isCountryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="card w-full max-w-sm p-6 bg-zinc-900">
                <h3 className="text-lg font-bold mb-4">Новая страна</h3>
                <form onSubmit={handleCreateCountry} className="space-y-3">
                    <div>
                        <label className="text-xs text-zinc-500">ID (slug)</label>
                        <input name="id" required className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" placeholder="e.g. fr" />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500">Название</label>
                        <input name="name" required className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" placeholder="France" />
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500">Флаг (Emoji)</label>
                        <input name="flag" required className="w-full p-2 bg-zinc-800 rounded border border-zinc-700" placeholder="🇫🇷" />
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                        <button type="button" onClick={() => setIsCountryModalOpen(false)} className="btn text-xs">Отмена</button>
                        <button type="submit" className="btn btn-primary text-xs">Создать</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );


}
