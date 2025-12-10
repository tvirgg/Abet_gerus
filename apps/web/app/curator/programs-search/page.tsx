"use client";
import { useState, useEffect } from "react";
import { useCountry } from "@/shared/CountryContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const CATEGORIES = ["IT", "Business", "Engineering", "Arts/Design", "Law", "Medicine", "Science", "Humanities"];

export default function ProgramsSearchPage() {
  const { countries, universities } = useCountry();
  
  const [filterCountry, setFilterCountry] = useState("");
  const [filterUniversity, setFilterUniversity] = useState("");
  const [filterCategory, setFilterCategory] = useState(""); // <--- Новый фильтр
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPrograms = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterCountry) params.append("countryId", filterCountry);
        if (filterUniversity) params.append("universityId", filterUniversity);
        if (filterCategory) params.append("category", filterCategory); // <--- Отправка на бэк
        if (searchQuery) params.append("search", searchQuery);

        const token = localStorage.getItem("accessToken");
        try {
            const res = await fetch(`${API_URL}/admin/programs/search?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setResults(await res.json());
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    
    const timer = setTimeout(fetchPrograms, 300);
    return () => clearTimeout(timer);
  }, [filterCountry, filterUniversity, filterCategory, searchQuery]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Поиск образовательных программ</h1>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div>
            <label className="text-xs text-zinc-500 block mb-1">Страна</label>
            <select 
                className="w-full p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-sm"
                value={filterCountry}
                onChange={(e) => { setFilterCountry(e.target.value); setFilterUniversity(""); }}
            >
                <option value="">Все страны</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.flag_icon} {c.name}</option>)}
            </select>
        </div>
        <div>
            <label className="text-xs text-zinc-500 block mb-1">Университет</label>
            <select 
                className="w-full p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-sm"
                value={filterUniversity}
                onChange={(e) => setFilterUniversity(e.target.value)}
                disabled={!filterCountry}
            >
                <option value="">Все университеты</option>
                {universities
                    .filter(u => !filterCountry || u.countryId === filterCountry)
                    .map(u => <option key={u.id} value={u.id}>{u.name}</option>)
                }
            </select>
        </div>
        <div>
            <label className="text-xs text-zinc-500 block mb-1">Категория</label>
            <select 
                className="w-full p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
            >
                <option value="">Все категории</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
        </div>
        <div>
             <label className="text-xs text-zinc-500 block mb-1">Поиск</label>
             <input 
                type="text"
                placeholder="Название..."
                className="w-full p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
         {loading ? (
             <div className="text-center text-zinc-500 py-10">Поиск...</div>
         ) : results.length === 0 ? (
             <div className="text-center text-zinc-500 py-10">Программы не найдены</div>
         ) : (
             results.map((prog) => (
                 <div key={prog.id} className="card p-4 hover:shadow-md transition border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{prog.university?.country?.flagIcon}</span>
                                <span className="text-xs font-bold text-zinc-500 uppercase">{prog.university?.name}</span>
                                {prog.category && (
                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full ml-2">
                                        {prog.category}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold">{prog.title}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                <span>📅 Дедлайн: <b>{prog.deadline || "Не указан"}</b></span>
                            </div>
                        </div>
                        {prog.link && (
                            <a 
                                href={prog.link} 
                                target="_blank" 
                                className="btn border border-zinc-200 dark:border-zinc-700 text-sm px-3 py-1"
                            >
                                На сайт ↗
                            </a>
                        )}
                    </div>
                 </div>
             ))
         )}
      </div>
    </div>
  );
}
