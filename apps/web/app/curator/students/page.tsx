"use client";
import { useEffect, useState, useMemo } from "react";
import { useCountry } from "@/shared/CountryContext";
import { useAuth } from "@/shared/AuthContext";
import StudentModal, { StudentFull } from "./StudentModal";
import Avatar from "@/shared/Avatar";
import QuestDetailModal from "@/app/student/quests/QuestDetailModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Типы для задач в канбане (Mock)
type StudentTask = {
  id: number;
  title: string;
  status: "TODO" | "REVIEW" | "CHANGES_REQUESTED" | "DONE";
  xpReward: number;
  stage: string;
  description: string;
};

// Функция-мок для генерации задач
const generateMockTasks = (studentId: string): StudentTask[] => {
    return [
        { id: 101, title: "Создать почту Gmail", status: "DONE", xpReward: 20, stage: "Подготовка", description: "..." },
        { id: 102, title: "Загрузить паспорт", status: "REVIEW", xpReward: 30, stage: "Документы", description: "..." },
        { id: 103, title: "Апостиль аттестата", status: "CHANGES_REQUESTED", xpReward: 50, stage: "Документы", description: "..." },
        { id: 104, title: "Запись на IELTS", status: "TODO", xpReward: 80, stage: "Экзамены", description: "..." },
    ];
};

export default function StudentPanelPage() {
  const { countries } = useCountry();
  const { user } = useAuth();
  
  const [students, setStudents] = useState<StudentFull[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- НОВЫЕ СОСТОЯНИЯ ---
  const [searchTerm, setSearchTerm] = useState("");
  const [listTab, setListTab] = useState<'my' | 'all'>('my'); // Вкладки
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentFull | null>(null);
  const [selectedTask, setSelectedTask] = useState<StudentTask | null>(null);

  const fetchStudents = async () => {
    const token = localStorage.getItem("accessToken");
    try {
        const res = await fetch(`${API_URL}/admin/students`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if(res.ok) {
            const data = await res.json();
            setStudents(data);
        }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // --- ЛОГИКА ФИЛЬТРАЦИИ ---
  const filteredStudents = useMemo(() => {
    let list = students;

    // 1. Фильтр по табам "Мои" / "Все"
    if (listTab === 'my' && user?.curatorId) {
        list = list.filter(s => s.curatorId === user.curatorId);
    }
    // Если пользователь - админ, но не куратор (нет curatorId), вкладка "Мои" будет пустой, это ок.

    // 2. Поиск
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(s => 
            s.fullName.toLowerCase().includes(lower) || 
            s.email.toLowerCase().includes(lower)
        );
    }
    
    return list;
  }, [students, searchTerm, listTab, user]);

  // Автовыбор первого студента при смене списка
  useEffect(() => {
      if (filteredStudents.length > 0) {
          // Если текущий выбранный студент есть в новом списке - оставляем, иначе выбираем первого
          if (!selectedStudentId || !filteredStudents.find(s => s.id === selectedStudentId)) {
              setSelectedStudentId(filteredStudents[0].id);
          }
      } else {
          setSelectedStudentId(null);
      }
  }, [filteredStudents, listTab]); // selectedStudentId убрал из deps, чтобы не циклило

  const activeStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentId), 
  [students, selectedStudentId]);

  const activeCountry = useMemo(() => 
    countries.find(c => c.id === activeStudent?.countryId),
  [countries, activeStudent]);

  const studentTasks = useMemo(() => {
      if (!activeStudent) return [];
      return generateMockTasks(activeStudent.id);
  }, [activeStudent]);

  const handleSaveStudent = async (data: any) => {
    const token = localStorage.getItem("accessToken");
    let res;
    
    // Если создает куратор, и curatorId не задан явно - присваиваем себе
    if (!data.id && user?.curatorId && !data.curatorId) {
        data.curatorId = user.curatorId;
    }

    if (data.id) {
        res = await fetch(`${API_URL}/admin/students/${data.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });
    } else {
        res = await fetch(`${API_URL}/admin/students`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });
    }

    if (res.ok) {
        await fetchStudents();
        return await res.json();
    } else {
        throw new Error("Failed");
    }
  };

  if (loading) return <div className="p-8 text-zinc-500">Загрузка данных...</div>;

  const columns = {
    todo: studentTasks.filter(t => t.status === "TODO"),
    review: studentTasks.filter(t => t.status === "REVIEW" || t.status === "CHANGES_REQUESTED"),
    done: studentTasks.filter(t => t.status === "DONE"),
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">Студенты</h1>
        <p className="text-zinc-400 text-sm">Управление базой студентов и задачами.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 h-full overflow-hidden">
        
        {/* === Левая колонка: Список === */}
        <div className="card flex flex-col overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
                {/* Табы */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button 
                        onClick={() => setListTab('my')}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${listTab === 'my' ? 'bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Мои студенты
                    </button>
                    <button 
                        onClick={() => setListTab('all')}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${listTab === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                    >
                        Все студенты
                    </button>
                </div>

                {/* Поиск */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Поиск по имени..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <span className="absolute left-3 top-2.5 text-zinc-400">🔍</span>
                </div>
                
                {/* Кнопка добавить */}
                {user?.role === 'admin' && (
                    <button 
                        onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
                        className="w-full btn btn-primary text-xs py-2"
                    >
                        + Новый студент
                    </button>
                )}
            </div>
            
            <div className="overflow-y-auto p-2 flex-1">
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                         {searchTerm ? "Ничего не найдено" : (listTab === 'my' ? "У вас нет студентов" : "Список пуст")}
                    </div>
                ) : (
                    <ul className="space-y-1">
                        {filteredStudents.map(student => (
                            <li key={student.id}>
                                <button
                                    onClick={() => setSelectedStudentId(student.id)}
                                    className={`w-full text-left px-3 py-3 rounded-xl transition flex items-center gap-3 relative ${
                                        selectedStudentId === student.id 
                                        ? "bg-black text-white dark:bg-zinc-800 shadow-md" 
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                                    }`}
                                >
                                    <Avatar name={student.fullName} level={Math.floor(student.xpTotal/200)+1} className="w-8 h-8 text-xs shrink-0" />
                                    <div className="overflow-hidden flex-1">
                                        <div className="font-medium text-sm truncate">{student.fullName}</div>
                                        <div className="flex items-center gap-2 text-[10px] opacity-70">
                                            <span className="truncate">{student.email}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Если смотрим общий список - показываем чей студент */}
                                    {listTab === 'all' && student.curatorName && (
                                        <div className={`text-[9px] px-1.5 py-0.5 rounded border ${selectedStudentId === student.id ? "border-zinc-600 bg-zinc-700 text-zinc-300" : "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800"}`}>
                                            {student.curatorName.split(' ')[0]}
                                        </div>
                                    )}

                                    {!student.isActive && (
                                        <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2" title="Отключен"></span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

        {/* === Правая колонка: Канбан и Инфо === */}
        {activeStudent ? (
            <div className="flex flex-col h-full overflow-hidden">
                {/* Header Info */}
                <div className="card p-4 mb-4 flex justify-between items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                        <Avatar name={activeStudent.fullName} level={Math.floor(activeStudent.xpTotal/200)+1} className="w-12 h-12 text-lg" />
                        <div>
                            <h2 className="text-lg font-bold">{activeStudent.fullName}</h2>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span>{activeCountry?.flag_icon} {activeCountry?.name || "Нет страны"}</span>
                                <span>•</span>
                                <span className="font-mono text-blue-500">{activeStudent.bindingCode}</span>
                                {activeStudent.curatorName && (
                                    <>
                                        <span>•</span>
                                        <span>Куратор: {activeStudent.curatorName}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <button 
                             onClick={() => { setEditingStudent(activeStudent); setIsModalOpen(true); }}
                             className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition"
                        >
                            Настройки
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="grid grid-cols-3 gap-4 h-full min-w-[800px]">
                        
                        {/* Column: To Do */}
                        <div className="flex flex-col h-full">
                            <div className="mb-2 flex items-center justify-between px-1">
                                <span className="text-xs font-bold uppercase text-zinc-500">К выполнению</span>
                                <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{columns.todo.length}</span>
                            </div>
                            <div className="flex-1 bg-zinc-100/50 dark:bg-zinc-900/30 rounded-xl p-2 overflow-y-auto space-y-2 border border-zinc-200/50 dark:border-zinc-800/50">
                                {columns.todo.map(task => (
                                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                                ))}
                            </div>
                        </div>

                        {/* Column: In Review */}
                        <div className="flex flex-col h-full">
                            <div className="mb-2 flex items-center justify-between px-1">
                                <span className="text-xs font-bold uppercase text-blue-500">На проверке</span>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{columns.review.length}</span>
                            </div>
                            <div className="flex-1 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl p-2 overflow-y-auto space-y-2 border border-blue-100/50 dark:border-blue-900/20">
                                {columns.review.map(task => (
                                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                                ))}
                            </div>
                        </div>

                        {/* Column: Done */}
                        <div className="flex flex-col h-full">
                            <div className="mb-2 flex items-center justify-between px-1">
                                <span className="text-xs font-bold uppercase text-green-500">Готово</span>
                                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">{columns.done.length}</span>
                            </div>
                            <div className="flex-1 bg-green-50/30 dark:bg-green-900/10 rounded-xl p-2 overflow-y-auto space-y-2 border border-green-100/50 dark:border-green-900/20">
                                {columns.done.map(task => (
                                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 h-full card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-4xl mb-3 opacity-50">👨‍🎓</div>
                <p>Выберите студента из списка</p>
            </div>
        )}
      </div>

      {isModalOpen && (
          <StudentModal 
            student={editingStudent}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveStudent}
          />
      )}

      {selectedTask && (
          <QuestDetailModal 
            quest={{ ...selectedTask, submission: null } as any} 
            onClose={() => setSelectedTask(null)} 
          />
      )}
    </div>
  );
}

function TaskCard({ task, onClick }: { task: StudentTask; onClick: () => void }) {
    const isReview = task.status === 'REVIEW';
    const isChanges = task.status === 'CHANGES_REQUESTED';
    
    return (
        <div 
            onClick={onClick}
            className={`
                p-3 rounded-lg border shadow-sm cursor-pointer transition hover:shadow-md
                ${isReview ? 'bg-white dark:bg-zinc-800 border-blue-200 dark:border-blue-900' : 
                  isChanges ? 'bg-white dark:bg-zinc-800 border-red-200 dark:border-red-900' :
                  'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}
            `}
        >
            <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-tight">{task.stage}</span>
                <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500">+{task.xpReward}</span>
            </div>
            <div className="font-medium text-sm mt-1 mb-2 line-clamp-2">{task.title}</div>
            
            {isChanges && (
                <div className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded inline-block">
                    Требуются правки
                </div>
            )}
             {isReview && (
                <div className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded inline-block">
                    Ждет проверки
                </div>
            )}
        </div>
    );
}
