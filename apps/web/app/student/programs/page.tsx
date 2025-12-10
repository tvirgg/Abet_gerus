"use client";
import { useState, useMemo } from "react";
import { useCountry, type Program, type University } from "../../../shared/CountryContext";
import ProgramDetailModal from "./ProgramDetailModal";

export default function StudentProgramsPage() {
  const { universities, programs, selectedCountryId } = useCountry();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Группируем программы по университетам для текущей страны
  const universityGroups = useMemo(() => {
    const relevantUniversities = universities.filter((u: University) => u.countryId === selectedCountryId);
    
    return relevantUniversities.map((uni: University) => {
        // Фильтруем программы этого вуза
        const uniPrograms = programs.filter((p: Program) => 
            p.university_id === uni.id
        );
        return { university: uni, programs: uniPrograms };
    }).filter((group: { university: University; programs: Program[] }) => group.programs.length > 0); // Скрываем вузы без программ

  }, [universities, programs, selectedCountryId]) as { university: University; programs: Program[] }[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Каталог Программ</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Выберите программу, чтобы увидеть требования, задачи и начать поступление.
        </p>
      </div>

      {universityGroups.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
              <div className="text-4xl mb-2">🌍</div>
              Программы для выбранной страны пока не добавлены.
          </div>
      ) : (
          universityGroups.map(({ university, programs }: { university: University; programs: Program[] }) => (
            <div key={university.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4 px-1">
                <span className="text-3xl filter drop-shadow-sm">{university.logo_url}</span>
                <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{university.name}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {programs.map((program: Program) => (
                  <button
                    key={program.id}
                    onClick={() => setSelectedProgram(program)}
                    className="group relative h-48 w-full rounded-2xl overflow-hidden text-left shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 bg-zinc-800">
                        {program.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                                src={program.image_url} 
                                alt={program.title} 
                                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-900" />
                        )}
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                        {program.category && (
                            <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600/80 backdrop-blur-md rounded-md">
                                {program.category}
                            </span>
                        )}
                        <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-blue-200 transition-colors">
                            {program.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                            <span>📅 Дедлайн: {program.deadline || "Не указан"}</span>
                        </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
      )}

      {selectedProgram && (
        <ProgramDetailModal 
            program={selectedProgram} 
            onClose={() => setSelectedProgram(null)} 
        />
      )}
    </div>
  );
}
