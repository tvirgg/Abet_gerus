"use client";
import { useEffect, useState, useMemo } from "react";
import baseProfiles from "@/mock/university_profiles.json";
import { useCountry } from "@/shared/CountryContext";
import UniversityList from "./UniversityList";
import QuestEditor from "./QuestEditor";

export type UniversityProfile = {
  universityId: string;
  countryId: string;
  assignedQuests: any[];
};

export default function ConfiguratorPage() {
  const { countries } = useCountry();
  const [profiles, setProfiles] = useState<UniversityProfile[]>(baseProfiles as UniversityProfile[]);
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(countries[0]?.id || null);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);

  useEffect(() => {
    // В реальном приложении здесь будет загрузка данных с сервера
    // Для мока мы можем загрузить из localStorage
    const savedProfiles = localStorage.getItem("universityProfilesOverride");
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles));
    }
  }, []);

  const handleSelectCountry = (countryId: string) => {
    setSelectedCountryId(countryId);
    setSelectedUniversityId(null); // Сбрасываем выбор университета при смене страны
  };

  const handleUpdateProfile = (updatedProfile: UniversityProfile) => {
    setProfiles(prev => 
      prev.map(p => p.universityId === updatedProfile.universityId ? updatedProfile : p)
    );
  };
  
  const saveChanges = () => {
    localStorage.setItem("universityProfilesOverride", JSON.stringify(profiles));
    alert("Конфигурации университетов сохранены!");
  };

  const uniqueCountries = useMemo(() => {
      const countryIds = new Set(profiles.map(p => p.countryId));
      return countries.filter(c => countryIds.has(c.id));
  }, [profiles, countries]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Конфигуратор Программ</h1>
          <p className="text-zinc-400 text-sm">Управляйте задачами для каждого университета.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn bg-white text-black">Импорт данных университетов</button>
          <button className="btn btn-primary" onClick={saveChanges}>Сохранить все изменения</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* Колонка 1: Страны */}
        <div className="card p-3 overflow-y-auto">
          <h2 className="font-semibold px-2 mb-2">Страны</h2>
          <ul className="space-y-1">
            {uniqueCountries.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => handleSelectCountry(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedCountryId === c.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-700'}`}
                >
                  {c.flag_icon} {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Колонка 2: Университеты */}
        <div className="card p-3 overflow-y-auto">
          <UniversityList
            countryId={selectedCountryId}
            profiles={profiles}
            selectedUniversityId={selectedUniversityId}
            onSelectUniversity={setSelectedUniversityId}
          />
        </div>

        {/* Колонка 3: Редактор Задач */}
        <div className="card p-3 overflow-y-auto">
          <QuestEditor
            profile={profiles.find(p => p.universityId === selectedUniversityId)}
            onUpdateProfile={handleUpdateProfile}
          />
        </div>
      </div>
    </div>
  );
}
