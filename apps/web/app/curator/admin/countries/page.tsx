"use client";
import { useEffect, useState, useMemo } from "react";
import { useCountry } from "@/shared/CountryContext";
import QuestEditor from "./QuestEditor";
import ProgramEditModal from "./ProgramEditModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function ConfiguratorPage() {
  // @ts-ignore - refreshData injected via any
  const { countries, universities, refreshData, quests } = useCountry();
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  
  // Tab state for the 3rd column
  const [configTab, setConfigTab] = useState<'tasks' | 'programs'>('tasks');
  const [programs, setPrograms] = useState<any[]>([]); // Инициализируем массивом
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);

  useEffect(() => {
      if (countries.length > 0 && !selectedCountryId) {
          setSelectedCountryId(countries[0].id);
      }
  }, [countries]);

  const filteredUniversities = useMemo(() => {
      return universities.filter((u: any) => u.countryId === selectedCountryId);
  }, [universities, selectedCountryId]);
  
  // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
  // Fetch programs whenever university changes
  useEffect(() => {
      if (selectedUniversityId) {
          const token = localStorage.getItem("accessToken");
          fetch(`${API_URL}/admin/programs/search?universityId=${selectedUniversityId}`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          .then(async (res) => {
              if (res.ok) {
                  const data = await res.json();
                  // Проверяем, что пришел именно массив
                  if (Array.isArray(data)) {
                      setPrograms(data);
                  } else {
                      console.error("API Error: Programs data is not an array", data);
                      setPrograms([]);
                  }
              } else {
                  console.error("API Error status:", res.status);
                  setPrograms([]);
              }
          })
          .catch(err => {
              console.error("Fetch failed", err);
              setPrograms([]);
          });
      } else {
          setPrograms([]);
      }
  }, [selectedUniversityId]);

  const currentProfile = useMemo(() => {
      const assignedQuests = quests.filter((q: any) => {
          if (selectedUniversityId) return q.universityId === selectedUniversityId;
          return q.countryId === selectedCountryId;
      });
      
      return {
          universityId: selectedUniversityId || "country-level",
          countryId: selectedCountryId || "",
          assignedQuests
      };
  }, [selectedUniversityId, selectedCountryId, quests]);

  // API Actions
  const saveTaskTemplate = async (task: any) => {
      const token = localStorage.getItem("accessToken");
      const payload = {
          ...task,
          universityId: selectedUniversityId, 
          countryId: !selectedUniversityId ? selectedCountryId : undefined 
      };
      if (task.id < 0) delete payload.id; // New task

      const res = await fetch(`${API_URL}/admin/task-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
      });
      
      if (res.ok) await refreshData();
  };
  
  const deleteTaskTemplate = async (id: number) => {
       const token = localStorage.getItem("accessToken");
       await fetch(`${API_URL}/admin/task-templates/${id}`, {
           method: "DELETE",
           headers: { Authorization: `Bearer ${token}` }
       });
       await refreshData();
  }
  
  // Program Actions
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
          // Refresh programs list safely
           fetch(`${API_URL}/admin/programs/search?universityId=${selectedUniversityId}`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          .then(r => r.json())
          .then(data => {
             if(Array.isArray(data)) setPrograms(data);
          });
      }
  };

  const handleDeleteProgram = async (id: number) => {
       if(!confirm("Удалить программу?")) return;
       const token = localStorage.getItem("accessToken");
       await fetch(`${API_URL}/admin/programs/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
       // Refresh locally
       setPrograms(prev => Array.isArray(prev) ? prev.filter(p => p.id !== id) : []);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Страны и Программы</h1>
          <p className="text-zinc-400 text-sm">Управление данными в БД.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* Countries */}
        <div className="card p-3 overflow-y-auto">
          <h2 className="font-semibold px-2 mb-2">Страны</h2>
          <ul className="space-y-1">
            {countries.map((c: any) => (
              <li key={c.id}>
                <button
                  onClick={() => { setSelectedCountryId(c.id); setSelectedUniversityId(null); setConfigTab('tasks'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedCountryId === c.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-700'}`}
                >
                  {c.flag_icon} {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Universities */}
        <div className="card p-3 overflow-y-auto">
          <h2 className="font-semibold px-2 mb-2">Университеты</h2>
          {filteredUniversities.length > 0 ? (
              <ul className="space-y-1">
                  {filteredUniversities.map((uni: any) => (
                      <li key={uni.id}>
                          <button
                              onClick={() => { setSelectedUniversityId(uni.id); setConfigTab('programs'); }}
                              className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedUniversityId === uni.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-700'}`}
                          >
                              {uni.logo_url} {uni.name}
                          </button>
                      </li>
                  ))}
              </ul>
          ) : <p className="text-zinc-500 text-sm px-2">Нет университетов</p>}
        </div>

        {/* Config Column (Tasks or Programs) */}
        <div className="card p-3 overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-3">
             <button 
                onClick={() => setConfigTab('tasks')}
                className={`flex-1 py-2 text-sm font-medium ${configTab === 'tasks' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-zinc-500'}`}
             >
                 Задачи
             </button>
             <button 
                onClick={() => setConfigTab('programs')}
                disabled={!selectedUniversityId}
                className={`flex-1 py-2 text-sm font-medium ${configTab === 'programs' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-zinc-500 disabled:opacity-50'}`}
             >
                 Программы
             </button>
          </div>

          {configTab === 'tasks' ? (
            <QuestEditor
                profile={currentProfile}
                onUpdateProfile={() => {}} 
                apiSave={saveTaskTemplate}
                apiDelete={deleteTaskTemplate}
            />
          ) : (
            <div>
                <div className="p-2">
                    <button onClick={() => { setEditingProgram(null); setIsProgramModalOpen(true); }} className="btn btn-primary w-full text-sm">
                    + Добавить программу
                    </button>
                </div>
                <ul className="space-y-2 mt-2">
                    {/* --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Добавлена проверка на массив --- */}
                    {Array.isArray(programs) && programs.map((prog: any) => (
                        <li key={prog.id} className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-semibold text-sm">{prog.title}</div>
                                    <div className="text-xs text-zinc-500">Дедлайн: {prog.deadline}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingProgram(prog); setIsProgramModalOpen(true); }} className="text-xs text-blue-400">Ред.</button>
                                    <button onClick={() => handleDeleteProgram(prog.id)} className="text-xs text-red-400">X</button>
                                </div>
                            </div>
                        </li>
                    ))}
                    {(!Array.isArray(programs) || programs.length === 0) && <p className="text-center text-xs text-zinc-500 mt-4">Нет программ</p>}
                </ul>
            </div>
          )}
        </div>
      </div>
      
      {isProgramModalOpen && selectedUniversityId && (
        <ProgramEditModal
            program={editingProgram}
            universityId={selectedUniversityId}
            onSave={handleSaveProgram}
            onClose={() => setIsProgramModalOpen(false)}
        />
      )}
    </div>
  );
}