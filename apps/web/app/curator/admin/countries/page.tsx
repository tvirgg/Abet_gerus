"use client";
import { useEffect, useState, useMemo } from "react";
import { useCountry, Program } from "../../../../shared/CountryContext";
import QuestEditor from "./QuestEditor";
import ProgramEditModal from "./ProgramEditModal";
import UniversityAccordion from "./UniversityAccordion";
import ProgramDetailModal from "./ProgramDetailModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function ConfiguratorPage() {
  const { countries, universities, refreshData, quests } = useCountry();
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  
  // Состояние
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  
  // Модальные окна
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [viewingProgram, setViewingProgram] = useState<Program | null>(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [activeUniversityIdForCreate, setActiveUniversityIdForCreate] = useState<string | null>(null);

  // Инициализация страны
  useEffect(() => {
      if (countries.length > 0 && !selectedCountryId) {
          setSelectedCountryId(countries[0].id);
      }
  }, [countries]);

  // Загрузка программ при смене страны (загружаем все программы этой страны сразу для оптимизации UI)
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

  // Фильтруем университеты текущей страны
  const filteredUniversities = useMemo(() => {
      return universities.filter((u: any) => u.countryId === selectedCountryId);
  }, [universities, selectedCountryId]);
  
  // Профиль задач для страны (для редактора задач)
  const currentProfile = useMemo(() => {
      const assignedQuests = quests.filter((q: any) => q.countryId === selectedCountryId);
      return {
          universityId: "country-level",
          countryId: selectedCountryId || "",
          assignedQuests
      };
  }, [selectedCountryId, quests]);

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
           // Refresh list locally (simplified) or refetch
           // Refetching is safer
           const resP = await fetch(`${API_URL}/admin/programs/search?countryId=${selectedCountryId}`, {
              headers: { Authorization: `Bearer ${token}` }
           });
           setPrograms(await resP.json());
      }
  };

  const handleDeleteProgram = async (id: number) => {
       if(!confirm("Удалить программу?")) return;
       const token = localStorage.getItem("accessToken");
       await fetch(`${API_URL}/admin/programs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
       setPrograms(prev => prev.filter(p => p.id !== id));
  };
  
  // Tasks Logic (сохранено с предыдущей версии)
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">База знаний</h1>
          <p className="text-zinc-400 text-sm">Управление странами, вузами и программами.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr_350px] gap-6 h-[calc(100vh-12rem)]">
        
        {/* Col 1: Страны */}
        <div className="card p-3 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold px-2 mb-3 text-sm uppercase text-zinc-500">Страны</h2>
          <ul className="space-y-1">
            {countries.map((c: any) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedCountryId(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition text-sm flex items-center gap-2 ${
                    selectedCountryId === c.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="text-lg">{c.flag_icon}</span> {c.name}
                </button>
              </li>
            ))}
          </ul>
          <button className="mt-4 w-full py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-500 hover:border-blue-500 hover:text-blue-500 transition">
              + Добавить страну
          </button>
        </div>

        {/* Col 2: Университеты и Программы (Аккордеон) */}
        <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center px-1">
                 <h2 className="font-semibold">Университеты и Программы</h2>
                 <button className="text-xs bg-zinc-200 dark:bg-zinc-800 px-3 py-1.5 rounded-lg hover:bg-zinc-300 transition">
                     + Добавить ВУЗ
                 </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2">
                {filteredUniversities.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500">В этой стране пока нет университетов</div>
                ) : (
                    <div className="space-y-3">
                        {filteredUniversities.map((uni: any) => (
                            <div key={uni.id} className="relative group">
                                <UniversityAccordion
                                    university={uni}
                                    programs={programs.filter(p => p.university_id === uni.id || (p as any).universityId === uni.id)} // Учитываем разницу в нейминге API/Mock
                                    onSelectProgram={(p) => setViewingProgram(p)}
                                    onEditProgram={(p) => { setEditingProgram(p); setActiveUniversityIdForCreate(uni.id); setIsProgramModalOpen(true); }}
                                    onDeleteProgram={handleDeleteProgram}
                                />
                                {/* Кнопка добавления программы, появляется при наведении на группу вуза (можно улучшить UX) */}
                                <div className="absolute right-14 top-4 opacity-0 group-hover:opacity-100 transition">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setEditingProgram(null); 
                                            setActiveUniversityIdForCreate(uni.id); 
                                            setIsProgramModalOpen(true); 
                                        }}
                                        className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded shadow-sm hover:bg-blue-200"
                                    >
                                        + Программа
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Col 3: Задачи страны (Беклог) */}
        <div className="card p-3 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
             <div className="mb-4">
                 <h2 className="font-semibold text-sm">Беклог задач страны</h2>
                 <p className="text-xs text-zinc-500">Задачи, применяемые ко всем студентам в {countries.find(c => c.id === selectedCountryId)?.name}</p>
             </div>
             
             <QuestEditor
                profile={currentProfile}
                onUpdateProfile={() => {}} 
                apiSave={saveTaskTemplate}
                apiDelete={deleteTaskTemplate}
            />
        </div>
      </div>
      
      {/* Модалка редактирования/создания программы */}
      {isProgramModalOpen && activeUniversityIdForCreate && (
        <ProgramEditModal
            program={editingProgram}
            universityId={activeUniversityIdForCreate}
            onSave={handleSaveProgram}
            onClose={() => setIsProgramModalOpen(false)}
        />
      )}

      {/* Модалка просмотра программы (карточка) */}
      {viewingProgram && (
        <ProgramDetailModal
            program={viewingProgram}
            onClose={() => setViewingProgram(null)}
            onEdit={() => {
                setEditingProgram(viewingProgram);
                setActiveUniversityIdForCreate(viewingProgram.university_id || (viewingProgram as any).universityId);
                setViewingProgram(null);
                setIsProgramModalOpen(true);
            }}
        />
      )}
    </div>
  );
}
