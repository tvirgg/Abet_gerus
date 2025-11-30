"use client";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import allStudents from "@/mock/students.json";
import allCountries from "@/mock/countries.json";
import allProgress from "@/mock/student_progress.json";
import allQuests from "@/mock/quest_templates.json";

export default function StudentDossierPage() {
  const params = useParams();
  const studentId = Number(params.studentId);

  const student = useMemo(() => allStudents.find(s => s.id === studentId), [studentId]);
  const country = useMemo(() => allCountries.find(c => c.id === student?.country_id), [student]);
  const progress = useMemo(() => (allProgress as any)[studentId] || {}, [studentId]);

  if (!student || !country) {
    return <div>Студент не найден.</div>;
  }

  const requiredQuests = allQuests.filter(q => country.required_quest_ids.includes(q.id));

  const approveQuest = (questId: number) => {
    // В реальном приложении здесь будет вызов API
    alert(`(Mock) Квест #${questId} для студента ${student.name} одобрен.`);
  };

  const rejectQuest = (questId: number) => {
    // В реальном приложении здесь будет вызов API
    const reason = prompt(`Причина отклонения квеста #${questId}:`);
    alert(`(Mock) Квест #${questId} отклонен. Причина: ${reason}`);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{student.name}</h1>
        <p className="text-zinc-500">Досье студента | Операция: {country.flag_icon} {country.name}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card p-4">
          <h2 className="text-lg font-semibold mb-3">Трекер Квестов</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {requiredQuests.map(quest => {
              const questProgress = progress[quest.id];
              const status = questProgress?.status || 'todo';

              return (
                <div key={quest.id} className="p-3 rounded-xl border bg-zinc-50 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{quest.title}</span>
                    {status === 'done' && <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">Одобрен ✅</span>}
                    {status === 'review' && <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-700">На проверке ⏳</span>}
                    {status === 'todo' && <span className="text-xs px-2 py-1 rounded-full bg-zinc-500/10 text-zinc-500">Не выполнен</span>}
                  </div>
                  {questProgress?.submission && (
                    <div className="mt-2 text-xs border-t pt-2 text-zinc-500">
                      <p><b>Результат:</b> {typeof questProgress.submission === 'object' ? JSON.stringify(questProgress.submission) : questProgress.submission}</p>
                    </div>
                  )}
                  {status === 'review' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => approveQuest(quest.id)} className="btn btn-primary text-xs !py-1">Одобрить</button>
                      <button onClick={() => rejectQuest(quest.id)} className="btn text-xs !py-1 bg-red-500/10 text-red-600">Отклонить</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card p-4">
            <h2 className="text-lg font-semibold mb-3">Академический Профиль</h2>
            <ul className="text-sm space-y-2">
              <li><b>Email:</b> {student.email}</li>
              <li><b>GPA:</b> {student.gpa}</li>
              <li><b>IELTS:</b> {student.ielts_score}</li>
            </ul>
          </div>
          <div className="card p-4">
             <h2 className="text-lg font-semibold mb-3">Выбранные программы</h2>
             <ul className="text-sm space-y-1 list-disc list-inside">
                {student.selected_program_ids.map(id => <li key={id}>Программа #{id}</li>)}
             </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
