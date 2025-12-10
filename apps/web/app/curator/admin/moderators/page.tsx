"use client";
import { useEffect, useState, useMemo } from "react";
import { useCountry } from "@/shared/CountryContext";
import ModeratorModal from "./ModeratorModal";
import Calendar from "@/shared/Calendar";
import type { CalendarEvent } from "@/shared/Calendar";
import allQuestsTemplate from "@/mock/quest_templates.json"; // Мок для генерации событий


const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Moderator = {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  curator?: { // Data from relation
      fullName: string;
      specialization: string;
      bio: string;
      avatarUrl: string;
  };
};

type StudentShort = {
  id: string;
  fullName: string;
  countryId?: string;
  xpTotal: number;
};

export default function ModeratorsPage() {
  const { countries } = useCountry();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [students, setStudents] = useState<StudentShort[]>([]);
  const [selectedModeratorId, setSelectedModeratorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  // --- НОВОЕ: Состояние табов ---
  const [activeTab, setActiveTab] = useState<'info' | 'calendar' | 'tasks'>('info');

  const fetchModerators = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_URL}/admin/moderators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Removed mock enrichment, data comes from backend
        setModerators(data.curators);
        setStudents(data.students);
        if (!selectedModeratorId && data.curators.length > 0) setSelectedModeratorId(data.curators[0].id);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchModerators();
  }, []);

  const activeMod = moderators.find(m => m.id === selectedModeratorId);
  // Временная фильтрация для демо (четные к четным), 
  // в реале здесь должна быть проверка student.curatorId === activeMod.id
  const linkedStudents = students.filter((s, idx) => {
     if (!activeMod) return false;
     const modIndex = moderators.findIndex(m => m.id === activeMod.id);
     return idx % moderators.length === modIndex;
  });

  // --- НОВОЕ: Генерация статистики и данных для табов ---
  const moderatorStats = useMemo(() => {
      if (!activeMod) return { totalXP: 0, studentsCount: 0, pendingReviews: 0 };
      const totalXP = linkedStudents.reduce((acc, s) => acc + s.xpTotal, 0);
      // Имитация: у каждого 3-го студента есть задача на проверку
      const pendingReviews = Math.floor(linkedStudents.length / 3); 
      return { totalXP, studentsCount: linkedStudents.length, pendingReviews };
  }, [activeMod, linkedStudents]);

  const moderatorEvents = useMemo(() => {
      if (!activeMod) return [];
      const events: CalendarEvent[] = [];
      // Генерируем фейковые дедлайны для студентов этого куратора
      linkedStudents.forEach((student, i) => {
          // Берем пару случайных квестов
          const q1 = allQuestsTemplate[i % allQuestsTemplate.length];
          if (q1 && q1.deadline) {
              events.push({
                  date: q1.deadline,
                  title: `${q1.title} (${student.fullName})`,
                  type: 'quest'
              });
          }
      });
      return events;
  }, [activeMod, linkedStudents, allQuestsTemplate]);

  const moderatorReviewTasks = useMemo(() => {
      if (!activeMod) return [];
      // Генерируем фейковый список задач на проверку
      const tasks = [];
      for(let i = 0; i < moderatorStats.pendingReviews; i++) {
          const student = linkedStudents[i];
          tasks.push({
              id: i + 1000,
              title: "Загрузка паспорта",
              studentName: student.fullName,
              date: new Date().toISOString().split('T')[0]
          });
      }
      return tasks;
  }, [activeMod, linkedStudents, moderatorStats]);

  const handleSaveModerator = async (data: any) => {
      const token = localStorage.getItem("accessToken");
      let res;
      
      // Pass full data object (includes profile fields and password)
      if (data.id) {
          res = await fetch(`${API_URL}/admin/moderators/${data.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(data)
          });
      } else {
          res = await fetch(`${API_URL}/admin/moderators`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(data)
          });
      }
      if (res.ok) {
          await fetchModerators();
          return await res.json(); // Возвращаем данные (там пароль при создании)
      } else {
          throw new Error("Failed");
      }
  };

  if (loading) return <div className="p-8 text-zinc-500">Загрузка данных...</div>;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Управление Модераторами</h1>
        <p className="text-zinc-400 text-sm">Профили кураторов и распределение студентов.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 h-full overflow-hidden">
        {/* Список модераторов */}
        <div className="card overflow-y-auto p-2">
          <div className="p-2 flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase">Список ({moderators.length})</span>
              <button 
                onClick={() => { setModalMode('create'); setIsModalOpen(true); }}
                className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                + Добавить
              </button>
          </div>
          <ul className="space-y-1">
            {moderators.map((mod, index) => (
              <li key={mod.id}>
                <button
                  onClick={() => setSelectedModeratorId(mod.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition flex items-center gap-3 ${
                    selectedModeratorId === mod.id 
                      ? "bg-black text-white dark:bg-zinc-800" 
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
                    {mod.curator?.fullName?.[0]?.toUpperCase() || mod.email[0]?.toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-medium text-sm truncate">{mod.curator?.fullName || mod.email}</div>
                    <div className="text-xs text-zinc-500 truncate">{mod.curator?.specialization || "Куратор"}</div>
                    {/* Индикатор задач (фейк) */}
                    {index % 2 === 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            <span className="text-[10px] text-zinc-400">Есть задачи</span>
                        </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Профиль и студенты */}
        {activeMod ? (
          <div className="flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Резюме */}
            <div className="card p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden">
                    {activeMod.curator?.avatarUrl ? (
                      <img 
                        src={activeMod.curator.avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl text-white font-bold">
                        {activeMod.curator?.fullName?.[0]?.toUpperCase() || activeMod.email[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{activeMod.curator?.fullName || "Без имени"}</h2>
                    <p className="text-zinc-500 text-sm">{activeMod.email}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${activeMod.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {activeMod.isActive ? 'Активен' : 'Отключен'}
                    </span>
                  </div>
                </div>
                <button 
                    onClick={() => { setModalMode('edit'); setIsModalOpen(true); }}
                    className="btn border border-zinc-300 dark:border-zinc-700 text-xs"
                >
                    Редактировать
                </button>
              </div>
              
              {/* Табы */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-700 mb-4">
                  <button 
                    onClick={() => setActiveTab('info')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === 'info' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Инфо / Статистика
                  </button>
                  <button 
                    onClick={() => setActiveTab('calendar')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === 'calendar' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Календарь
                  </button>
                  <button 
                    onClick={() => setActiveTab('tasks')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === 'tasks' ? 'border-black dark:border-white text-black dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Задачи ({moderatorStats.pendingReviews})
                  </button>
              </div>

              {/* Контент табов */}
              <div className="min-h-[300px]">
                {activeTab === 'info' && (
                    <div className="space-y-6">
                         <div className="grid grid-cols-3 gap-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl text-center">
                                <div className="text-2xl font-bold">{moderatorStats.studentsCount}</div>
                                <div className="text-xs text-zinc-500">Студентов</div>
                            </div>
                            <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl text-center">
                                <div className="text-2xl font-bold text-yellow-600">{moderatorStats.totalXP}</div>
                                <div className="text-xs text-zinc-500">Общий XP</div>
                            </div>
                             <div className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl text-center">
                                <div className="text-2xl font-bold text-blue-600">{moderatorStats.pendingReviews}</div>
                                <div className="text-xs text-zinc-500">На проверке</div>
                            </div>
                         </div>

                         <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-sm">Список студентов</h3>
                                <button className="text-xs text-blue-500 hover:underline">+ Привязать</button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50">
                                    <tr>
                                    <th className="px-4 py-2 rounded-l-lg">Имя</th>
                                    <th className="px-4 py-2 text-right rounded-r-lg">Страна</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedStudents.map(s => {
                                         const country = countries.find((c: any) => c.id === s.countryId);
                                         return (
                                            <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800">
                                                <td className="px-4 py-2 font-medium">{s.fullName}</td>
                                                <td className="px-4 py-2 text-right">{country?.flag_icon}</td>
                                            </tr>
                                         )
                                    })}
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}

                {activeTab === 'calendar' && (
                    <div>
                        <p className="text-xs text-zinc-500 mb-2">Дедлайны студентов этого куратора:</p>
                        <Calendar events={moderatorEvents} />
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div>
                        <h3 className="font-semibold text-sm mb-3">Очередь на проверку</h3>
                        {moderatorReviewTasks.length > 0 ? (
                            <ul className="space-y-2">
                                {moderatorReviewTasks.map(task => (
                                    <li key={task.id} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">{task.title}</div>
                                            <div className="text-xs text-zinc-500">Студент: {task.studentName}</div>
                                        </div>
                                        <button className="btn bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 text-xs py-1 px-3">
                                            Проверить
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-zinc-500 py-8">Очередь пуста 🎉</p>
                        )}
                    </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex items-center justify-center text-zinc-400">Выберите модератора</div>
        )}
      </div>

      {isModalOpen && (
        <ModeratorModal 
            moderator={modalMode === 'edit' ? activeMod : null}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveModerator}
        />
      )}
    </div>
  );
}
