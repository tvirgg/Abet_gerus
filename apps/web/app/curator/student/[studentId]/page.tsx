"use client";
import { useMemo, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCountry } from "@/shared/CountryContext";
import EditProfileModal from "./EditProfileModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function StudentDossierPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  const { countries, quests: allQuests } = useCountry();
  const [student, setStudent] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); // Для модалки новой задачи
  const [loading, setLoading] = useState(true);
  
  // Mock binding code (в реальности придет с API в объекте student)
  const bindingCode = student?.bindingCode || `S-${Math.floor(1000 + Math.random() * 9000)}`;

  const fetchStudentData = async () => {
      const token = localStorage.getItem("accessToken");
      try {
        // 1. Получаем профиль студента (через эндпоинт пользователя или students/:id)
        // В MVP мы добавили students/:id
        const resS = await fetch(`${API_URL}/students/${studentId}`, { headers: { Authorization: `Bearer ${token}` }});
        const sData = await resS.json();
        // Мокаем binding code, если его нет
        setStudent({ ...sData, bindingCode: sData.bindingCode || "S-4291" });

        // 2. Получаем задачи (через админку пока нет эндпоинта "получить задачи конкретного юзера", 
        // но в TasksService есть findAllForUser. 
        // Для MVP используем заглушку или добавим эндпоинт в TasksController)
        // *Временное решение:* покажем просто список, если есть доступ, или заглушку.
        // В коде выше мы не добавили эндпоинт для куратора, чтобы смотреть задачи конкретного студента.
        // Допустим, мы используем mock или добавим в TasksController позже.
      } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStudentData(); }, []);

  // Мок создания задачи (Ad-hoc)
  const handleCreateAdHocTask = async (taskTitle: string) => {
      // Тут будет POST /tasks с studentId
      alert(`Задача "${taskTitle}" назначена студенту (Mock)`);
      setIsTaskModalOpen(false);
  };

  const country = useMemo(() => countries.find(c => c.id === student?.countryId), [student, countries]);

  if (loading) return <div>Загрузка...</div>;
  if (!student || !country) {
    return <div>Студент не найден.</div>;
  }

  // Mock quests filter (в реальности данные придут с бэка)
  const requiredQuests = allQuests; // Пока показываем все шаблоны как пример

  const handleResetPassword = async () => {
      if(!confirm("Сбросить пароль студента на '12345678'?")) return;
      const token = localStorage.getItem("accessToken");
      await fetch(`${API_URL}/admin/users/${student.user.id}/reset-password`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      });
      alert("Пароль сброшен");
  };

  const handleUpdateProfile = async (data: any) => {
      const token = localStorage.getItem("accessToken");
      await fetch(`${API_URL}/students/${student.id}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(data)
      });
      setIsEditOpen(false);
      fetchStudentData();
  };

  const approveQuest = (questId: number) => {
    // ... (оставим как есть заглушку или подключим API)
    alert(`(Mock) Квест #${questId} для студента ${student.fullName} одобрен.`);
  };

  const rejectQuest = (questId: number) => { /* ... */ };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">{student.fullName}</h1>
          <p className="text-zinc-500">Досье студента | Операция: {country.flag_icon} {country.name}</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setIsEditOpen(true)} className="btn bg-zinc-200 text-black text-sm">Ред. профиль</button>
            <button onClick={handleResetPassword} className="btn bg-red-100 text-red-700 text-sm">Сброс пароля</button>
        </div>
      </div>

      {/* Блок Telegram и быстрых действий */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="card p-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
            <div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Telegram Binding</div>
                <div className="text-2xl font-mono font-bold tracking-wider mt-1">{bindingCode}</div>
                <div className="text-xs text-zinc-500 mt-1">Команда: <code>/link {bindingCode}</code></div>
            </div>
            <div className="text-3xl">🤖</div>
        </div>
        <div className="card p-4 flex items-center justify-between">
             <div>
                <div className="font-semibold">Индивидуальная задача</div>
                <div className="text-xs text-zinc-500">Назначить задачу вне общего плана</div>
            </div>
            <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-primary text-sm">+ Задача</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ... остальной код рендера задач ... */}
      </div>
      
      {isEditOpen && (
          <EditProfileModal student={student} onClose={() => setIsEditOpen(false)} onSave={handleUpdateProfile} />
      )}
      
      {/* Простая модалка создания задачи (инлайн) */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="card p-6 w-full max-w-md">
                <h3 className="font-bold mb-4">Новая задача</h3>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCreateAdHocTask(formData.get('title') as string);
                }}>
                    <label className="block text-sm mb-1">Название задачи</label>
                    <input name="title" required className="w-full p-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 mb-4" placeholder="Напр: Переделать справку" />
                    
                    <label className="block text-sm mb-1">Описание (опционально)</label>
                    <textarea name="desc" className="w-full p-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 mb-4" rows={3} />
                    
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn">Отмена</button>
                        <button type="submit" className="btn btn-primary">Назначить</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
