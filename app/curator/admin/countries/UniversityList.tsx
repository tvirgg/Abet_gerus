"use client";
import { useCountry } from "@/app/shared/CountryContext";
import type { UniversityProfile } from "./page";

type Props = {
  countryId: string | null;
  profiles: UniversityProfile[];
  selectedUniversityId: string | null;
  onSelectUniversity: (id: string) => void;
};

export default function UniversityList({ countryId, profiles, selectedUniversityId, onSelectUniversity }: Props) {
  const { universities } = useCountry();

  if (!countryId) {
    return <div className="p-4 text-center text-zinc-500">Выберите страну</div>;
  }

  const filteredUniversities = universities.filter(uni => 
    profiles.some(p => p.countryId === countryId && p.universityId === uni.id)
  );

  return (
    <div>
      <h2 className="font-semibold px-2 mb-2">Университеты</h2>
      {filteredUniversities.length > 0 ? (
        <ul className="space-y-1">
          {filteredUniversities.map(uni => (
            <li key={uni.id}>
              <button
                onClick={() => onSelectUniversity(uni.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${selectedUniversityId === uni.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-700'}`}
              >
                {uni.logo_url} {uni.name}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-center text-zinc-500 text-sm">Для этой страны не настроены университеты.</p>
      )}
    </div>
  );
}
