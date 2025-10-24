"use client";
import { Program, useCountry } from "@/app/shared/CountryContext";
import { useState } from "react";
import ProgramDetailModal from "./ProgramDetailModal";

export default function ProgramsPage() {
  const { universities, programs } = useCountry();
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold mb-2">Мои Программы</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">
          Здесь собраны целевые университеты и их специфические требования.
        </p>
        <div className="space-y-8">
          {universities.map((uni) => {
            const uniPrograms = programs.filter(p => uni.program_ids.includes(p.id));
            return (
              <section key={uni.id}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{uni.logo_url}</span>
                  <h2 className="text-lg font-semibold">{uni.name}</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniPrograms.map((prog) => (
                    <button
                      key={prog.id}
                      onClick={() => setSelectedProgram(prog)}
                      className="card text-left p-0 overflow-hidden transition hover:shadow-xl w-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={prog.image_url} alt={prog.title} className="w-full h-32 object-cover" />
                      <div className="p-4">
                        <div className="font-medium">{prog.title}</div>
                        <div className="text-xs text-zinc-500 mt-1">Дедлайн: {prog.deadline}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {selectedProgram && (
        <ProgramDetailModal program={selectedProgram} onClose={() => setSelectedProgram(null)} />
      )}
    </>
  );
}
