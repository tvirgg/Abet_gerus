"use client";
import { useEffect, useState, useMemo } from "react";
import { useCountry } from "@/shared/CountryContext";
import QuestEditor from "./QuestEditor";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function ConfiguratorPage() {
  // @ts-ignore - refreshData injected via any
  const { countries, universities, refreshData, quests } = useCountry();
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);

  useEffect(() => {
      if (countries.length > 0 && !selectedCountryId) {
          setSelectedCountryId(countries[0].id);
      }
  }, [countries]);

  const filteredUniversities = useMemo(() => {
      return universities.filter((u: any) => u.countryId === selectedCountryId);
  }, [universities, selectedCountryId]);
  
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Конфигуратор Программ (Live)</h1>
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
                  onClick={() => { setSelectedCountryId(c.id); setSelectedUniversityId(null); }}
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
                              onClick={() => setSelectedUniversityId(uni.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedUniversityId === uni.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-700'}`}
                          >
                              {uni.logo_url} {uni.name}
                          </button>
                      </li>
                  ))}
              </ul>
          ) : <p className="text-zinc-500 text-sm px-2">Нет университетов</p>}
        </div>

        {/* Quests */}
        <div className="card p-3 overflow-y-auto">
          <QuestEditor
            profile={currentProfile}
            onUpdateProfile={() => {}} 
            apiSave={saveTaskTemplate}
            apiDelete={deleteTaskTemplate}
          />
        </div>
      </div>
    </div>
  );
}
