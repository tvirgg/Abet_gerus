"use client";
import { useEffect, useMemo, useState } from "react";
import { useCountry } from "@/app/shared/CountryContext";
import AddStudentModal from "./AddStudentModal";

// --- ИЗМЕНЕНИЕ: Модель студента расширена для хранения индивидуальных настроек ---
export type Student = {
  id: string;
  name: string;
  countryId: string;
  assignedUniversityIds: string[];
  assignedQuestIds: number[];
  customQuests?: { id: number; title: string }[];
};

// --- НОВОЕ: Мок-данные для демонстрации UI как на скриншоте ---
const mockStudentProgress = [
  {
    id: "mock_1",
    name: "Артём Ганеев",
    countryId: "it",
    completedQuests: 4,
    totalQuests: 9,
    reviewQuests: 1,
  },
  {
    id: "mock_2",
    name: "Вероника Смирнова",
    countryId: "at",
    completedQuests: 2,
    totalQuests: 8,
    reviewQuests: 1,
  },
  {
    id: "mock_3",
    name: "Иван Петров",
    countryId: "at",
    completedQuests: 0,
    totalQuests: 8,
    reviewQuests: 1,
  },
];

const STORAGE_KEY = "managedStudents";

export default function StudentPanelPage() {
  const { countries } = useCountry();
  const [students, setStudents] = useState<Student[]>([]);
  // --- НОВОЕ: Состояние для управления модальным окном ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Загружаем студентов из localStorage, если они есть
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStudents(JSON.parse(raw));
    } catch {}
  }, []);

  // --- НОВОЕ: Функция сохранения студента из модального окна ---
  const handleSaveStudent = (newStudentData: Omit<Student, 'id'>) => {
    const newStudent: Student = { ...newStudentData, id: `student_${Date.now()}`};
    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStudents));
    setIsModalOpen(false); // Закрываем модальное окно после сохранения
  };

  // Объединяем мок-данных и реальных студентов для отображения
  const allStudents = useMemo(() => {
    const combined = [...mockStudentProgress];
    // Добавляем реальных студентов, но без прогресса (т.к. он не хранится)
    students.forEach(s => {
      combined.push({
        ...s,
        completedQuests: 0,
        // Для новых студентов считаем прогресс на лету (пока 0)
        totalQuests: s.assignedQuestIds.length,
        reviewQuests: 0,
      });
    });
    return combined;
  }, [students]);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold">Панель Студентов</h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-6">Обзор прогресса всех активных студентов.</p>
        {/* --- НОВОЕ: Кнопка для открытия модального окна --- */}
        <button className="btn btn-primary mb-6" onClick={() => setIsModalOpen(true)}>
          + Добавить студента
        </button>
      </div>

      <div className="space-y-4">
        {allStudents.map((student) => {
            const country = countries.find((c) => c.id === student.countryId);
            const progressPercentage = student.totalQuests > 0 ? (student.completedQuests / student.totalQuests) * 100 : 0;
            const isLowProgress = progressPercentage < 30 && student.completedQuests < 3;

            return (
                <div key={student.id} className="card p-4 bg-zinc-800/50">
                    <div className="grid grid-cols-[1fr_auto] gap-4">
                        <div>
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            <div className="text-sm text-zinc-400 flex items-center gap-2">
                                {country?.flag_icon} {country?.name || "Неизвестная страна"}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-medium">Прогресс</div>
                            <div className="text-xs text-zinc-400 mb-1">{student.completedQuests} / {student.totalQuests} квестов</div>
                            <div className="w-32 bg-zinc-700 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-white/10 my-3"></div>
                    <div className="flex items-center gap-2">
                        {student.reviewQuests > 0 && (
                            <div className="text-xs font-medium px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                                На проверке: {student.reviewQuests} квеста
                            </div>
                        )}
                        {isLowProgress && (
                            <div className="text-xs font-medium px-3 py-1 rounded-full bg-red-500/20 text-red-400">
                                Низкий прогресс
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {/* --- НОВОЕ: Рендер модального окна --- */}
      {isModalOpen && (
        <AddStudentModal onClose={() => setIsModalOpen(false)} onSave={handleSaveStudent} />
      )}
    </div>
  );
}
