"use client";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCountry } from "@/shared/CountryContext";
import { useAuth } from "@/shared/AuthContext";
import StudentModal, { StudentFull } from "./StudentModal";
import Avatar from "@/shared/Avatar";
import QuestDetailModal from "@/app/student/quests/QuestDetailModal";
import Calendar from "@/shared/Calendar";
import type { CalendarEvent } from "@/shared/Calendar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Типы для задач
type StudentTask = {
    id: number;
    title: string;
    status: "TODO" | "REVIEW" | "CHANGES_REQUESTED" | "DONE";
    xpReward: number;
    stage: string;
    description: string;
    deadline?: string;
    submission?: any;
};

// Тип для куратора в фильтре
type CuratorOption = {
    id: string; // curatorId
    fullName: string;
    userId: string;
};

export default function StudentPanelPage() {
    const { countries } = useCountry();
    const { user } = useAuth();
    const searchParams = useSearchParams();

    const [students, setStudents] = useState<StudentFull[]>([]);
    const [curators, setCurators] = useState<CuratorOption[]>([]); // Список кураторов для фильтра
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [studentTasks, setStudentTasks] = useState<StudentTask[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    // Фильтры
    const [searchTerm, setSearchTerm] = useState("");
    const [listTab, setListTab] = useState<'my' | 'all'>('my');
    const [filterCuratorId, setFilterCuratorId] = useState<string>(""); // Фильтр по куратору (для админа)

    // Табы правой панели
    const [activeTab, setActiveTab] = useState<'info' | 'calendar' | 'tasks'>('info');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentFull | null>(null);
    const [selectedTask, setSelectedTask] = useState<StudentTask | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // 1. Установка дефолтного таба в зависимости от роли
    useEffect(() => {
        if (user?.role === 'admin') {
            setListTab('all');
        } else {
            setListTab('my');
        }
    }, [user]);

    // 2. Загрузка данных
    const fetchData = async () => {
        const token = localStorage.getItem("accessToken");
        try {
            // Загружаем студентов
            const resStudents = await fetch(`${API_URL}/admin/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (resStudents.ok) {
                setStudents(await resStudents.json());
            }

            // Если Админ, загружаем список кураторов для фильтра
            if (user?.role === 'admin') {
                const resModerators = await fetch(`${API_URL}/admin/moderators`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resModerators.ok) {
                    const data = await resModerators.json();
                    // Мапим данные для селекта
                    const options = data.curators.map((c: any) => ({
                        id: c.curator?.id, // ID сущности Curator (нужен для связи со студентом)
                        userId: c.id,      // ID User
                        fullName: c.curator?.fullName || c.email
                    })).filter((c: any) => c.id); // Убираем тех, у кого нет профиля куратора
                    setCurators(options);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    // Эффект для выбора студента из URL
    useEffect(() => {
        const targetId = searchParams.get('studentId');
        if (targetId && students.length > 0) {
            if (students.find(s => s.id === targetId)) {
                setSelectedStudentId(targetId);
            }
        }
    }, [searchParams, students]);

    // 3. Загрузка задач при выборе студента
    useEffect(() => {
        if (selectedStudentId) {
            setTasksLoading(true);
            const token = localStorage.getItem("accessToken");
            fetch(`${API_URL}/curator/students/${selectedStudentId}/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(async (res) => {
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            setStudentTasks(data);
                        } else {
                            setStudentTasks([]);
                        }
                    } else {
                        setStudentTasks([]);
                    }
                })
                .catch(err => {
                    console.error(err);
                    setStudentTasks([]);
                })
                .finally(() => setTasksLoading(false));
        } else {
            setStudentTasks([]);
        }
    }, [selectedStudentId]);

    // 4. Логика фильтрации
    const filteredStudents = useMemo(() => {
        let list = students;

        // Таб "Мои"
        if (listTab === 'my') {
            if (user?.curatorId) {
                list = list.filter(s => s.curatorId === user.curatorId);
            } else {
                // Если у пользователя нет curatorId (например, чистый админ), список пуст
                list = [];
            }
        }

        // Таб "Все" + Фильтр по куратору (только для админа)
        if (listTab === 'all' && user?.role === 'admin' && filterCuratorId) {
            list = list.filter(s => s.curatorId === filterCuratorId);
        }

        // Поиск по тексту
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(s =>
                s.fullName.toLowerCase().includes(lower) ||
                s.email.toLowerCase().includes(lower)
            );
        }
        return list;
    }, [students, searchTerm, listTab, user, filterCuratorId]);

    const activeStudent = useMemo(() =>
        students.find(s => s.id === selectedStudentId),
        [students, selectedStudentId]);

    const activeCountries = useMemo(() => {
        if (!activeStudent?.countries || activeStudent.countries.length === 0) {
            // Fallback to legacy countryId
            if (activeStudent?.countryId) {
                const country = countries.find(c => c.id === activeStudent.countryId);
                return country ? [country] : [];
            }
            return [];
        }
        return activeStudent.countries;
    }, [countries, activeStudent]);

    // Статистика
    const stats = useMemo(() => {
        if (!Array.isArray(studentTasks)) return { total: 0, done: 0, review: 0, percent: 0 };
        const total = studentTasks.length;
        const done = studentTasks.filter(t => t.status === 'DONE').length;
        const review = studentTasks.filter(t => t.status === 'REVIEW').length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        return { total, done, review, percent };
    }, [studentTasks]);

    // Календарь
    const calendarEvents = useMemo(() => {
        if (!Array.isArray(studentTasks)) return [];
        return studentTasks
            .filter(t => t.deadline && t.status !== 'DONE')
            .map(t => ({
                date: t.deadline!,
                title: t.title,
                type: 'quest' as const
            }));
    }, [studentTasks]);

    // Канбан
    const columns = useMemo(() => {
        if (!Array.isArray(studentTasks)) return { todo: [], review: [], done: [] };
        return {
            todo: studentTasks.filter(t => t.status === "TODO"),
            review: studentTasks.filter(t => t.status === "REVIEW" || t.status === "CHANGES_REQUESTED"),
            done: studentTasks.filter(t => t.status === "DONE"),
        };
    }, [studentTasks]);

    const handleSaveStudent = async (data: any) => {
        const token = localStorage.getItem("accessToken");
        let res;

        if (!data.id && user?.curatorId && !data.curatorId) {
            data.curatorId = user.curatorId;
        }

        const payload = { ...data };

        if (data.id) {
            res = await fetch(`${API_URL}/admin/students/${data.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`${API_URL}/admin/students`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            await fetchData(); // Обновляем список
            return await res.json();
        } else {
            throw new Error("Failed");
        }
    };

    const handleDeleteStudent = async (id: string) => {
        const token = localStorage.getItem("accessToken");
        try {
            const res = await fetch(`${API_URL}/admin/students/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== id));
                if (selectedStudentId === id) setSelectedStudentId(null);
            } else {
                alert("Ошибка при удалении");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateAdHocTask = async (taskTitle: string) => {
        alert("Mock create task");
        setIsTaskModalOpen(false);
    };

    if (loading) return <div className="p-8 text-zinc-500">Загрузка данных...</div>;

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
                        {/* Табы - показываем "Мои", только если у юзера есть curatorId */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                            {user?.curatorId && (
                                <button
                                    onClick={() => setListTab('my')}
                                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${listTab === 'my' ? 'bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Мои студенты
                                </button>
                            )}
                            <button
                                onClick={() => setListTab('all')}
                                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition ${listTab === 'all' ? 'bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white' : 'text-zinc-500 hover:text-zinc-700'}`}
                            >
                                Все студенты
                            </button>
                        </div>

                        {/* Фильтр по куратору (ТОЛЬКО ДЛЯ АДМИНА) */}
                        {user?.role === 'admin' && listTab === 'all' && (
                            <div>
                                <select
                                    value={filterCuratorId}
                                    onChange={(e) => setFilterCuratorId(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                >
                                    <option value="">Все кураторы</option>
                                    {curators.map(c => (
                                        <option key={c.id} value={c.id}>{c.fullName}</option>
                                    ))}
                                    {/* Опция для поиска студентов без куратора, если нужно, можно добавить value="null" и обработать */}
                                </select>
                            </div>
                        )}

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

                        {/* Кнопка добавить (только Админ) */}
                        {user?.role === 'admin' && (
                            <button onClick={() => { setEditingStudent(null); setIsModalOpen(true); }} className="w-full btn btn-primary text-xs py-2">
                                + Новый студент
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto p-2 flex-1">
                        {filteredStudents.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                {listTab === 'my' ? "У вас нет студентов" : "Список пуст"}
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {filteredStudents.map(student => (
                                    <li key={student.id}>
                                        <button
                                            onClick={() => setSelectedStudentId(student.id)}
                                            className={`w-full text-left px-3 py-3 rounded-xl transition flex items-center gap-3 relative ${selectedStudentId === student.id
                                                    ? "bg-black text-white dark:bg-zinc-800 shadow-md"
                                                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                                                }`}
                                        >
                                            <Avatar name={student.fullName} level={Math.floor(student.xpTotal / 200) + 1} className="w-8 h-8 text-xs shrink-0" />
                                            <div className="overflow-hidden flex-1">
                                                <div className="font-medium text-sm truncate">{student.fullName}</div>
                                                <div className="flex items-center gap-2 text-[10px] opacity-70">
                                                    <span className="truncate">{student.email}</span>
                                                </div>
                                            </div>
                                            {listTab === 'all' && student.curatorName && (
                                                <div className="text-[9px] px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                                                    {student.curatorName.split(' ')[0]}
                                                </div>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* === Правая колонка: Детали студента === */}
                {activeStudent ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Header Info */}
                        <div className="card p-4 mb-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <Avatar name={activeStudent.fullName} level={Math.floor(activeStudent.xpTotal / 200) + 1} className="w-14 h-14 text-xl" />
                                    <div>
                                        <h2 className="text-xl font-bold">{activeStudent.fullName}</h2>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1">
                                            {activeCountries.length > 0 ? (
                                                <span>
                                                    {activeCountries.map((c, i) => (
                                                        <span key={c.id}>
                                                            {c.flag_icon} {c.name}
                                                            {i < activeCountries.length - 1 && ', '}
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : (
                                                <span>Нет страны</span>
                                            )}
                                            <span>XP: <span className="text-yellow-600 font-bold">{activeStudent.xpTotal}</span></span>
                                            <span className="font-mono text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">{activeStudent.bindingCode}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsTaskModalOpen(true)} className="btn bg-zinc-100 dark:bg-zinc-800 text-xs px-3 py-2">+ Задача</button>
                                    <button onClick={() => { setEditingStudent(activeStudent); setIsModalOpen(true); }} className="btn border border-zinc-200 dark:border-zinc-700 text-xs px-3 py-2">Настройки</button>
                                </div>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex gap-6 mt-6 border-b border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`pb-2 text-sm font-medium border-b-2 transition ${activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Инфо / Статистика
                                </button>
                                <button
                                    onClick={() => setActiveTab('calendar')}
                                    className={`pb-2 text-sm font-medium border-b-2 transition ${activeTab === 'calendar' ? 'border-blue-500 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Календарь
                                </button>
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={`pb-2 text-sm font-medium border-b-2 transition ${activeTab === 'tasks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
                                >
                                    Задачи ({studentTasks.length})
                                </button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden">
                            {activeTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto pr-2">
                                    <div className="card p-4 space-y-4">
                                        <h3 className="font-semibold text-sm">Прогресс по задачам</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Всего задач</span>
                                                <span className="font-bold">{stats.total}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Выполнено</span>
                                                <span className="font-bold text-green-600">{stats.done}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">На проверке</span>
                                                <span className="font-bold text-blue-600">{stats.review}</span>
                                            </div>
                                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 mt-2">
                                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${stats.percent}%` }}></div>
                                            </div>
                                            <p className="text-xs text-center text-zinc-400">{stats.percent}% завершено</p>
                                        </div>
                                    </div>
                                    <div className="card p-4">
                                        <h3 className="font-semibold text-sm mb-2">Детали</h3>
                                        <div className="text-sm space-y-2">
                                            <p><span className="text-zinc-500">Email:</span> {activeStudent.email}</p>
                                            <p><span className="text-zinc-500">Куратор:</span> {activeStudent.curatorName || 'Нет'}</p>
                                            <p><span className="text-zinc-500">Активен:</span> {activeStudent.isActive ? 'Да' : 'Нет'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'calendar' && (
                                <div className="card p-4 h-full overflow-y-auto">
                                    <Calendar events={calendarEvents} />
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="h-full overflow-x-auto overflow-y-hidden">
                                    {tasksLoading ? (
                                        <div className="p-10 text-center text-zinc-500">Загрузка задач...</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-4 h-full min-w-[800px]">
                                            <KanbanCol title="К выполнению" tasks={columns.todo} onTaskClick={setSelectedTask} />
                                            <KanbanCol title="На проверке" tasks={columns.review} onTaskClick={setSelectedTask} />
                                            <KanbanCol title="Готово" tasks={columns.done} onTaskClick={setSelectedTask} />
                                        </div>
                                    )}
                                </div>
                            )}
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
                    onSave={handleSaveStudent as any}
                    onDelete={handleDeleteStudent} // <--- передаем функцию
                />
            )}
            {selectedTask && <QuestDetailModal quest={selectedTask as any} onClose={() => setSelectedTask(null)} />}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="card p-6 w-full max-w-md">
                        <h3 className="font-bold mb-4">Новая задача</h3>
                        <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleCreateAdHocTask(formData.get('title') as string); }}>
                            <input name="title" required className="w-full p-2 border rounded-lg bg-zinc-50 dark:bg-zinc-800 mb-4" placeholder="Название задачи" />
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

// Компонент колонки
function KanbanCol({ title, tasks, onTaskClick }: { title: string, tasks: StudentTask[], onTaskClick: (t: StudentTask) => void }) {
    return (
        <div className="flex flex-col h-full">
            <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase text-zinc-500">{title}</span>
                <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{tasks.length}</span>
            </div>
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl p-2 overflow-y-auto space-y-2 border border-zinc-200/50 dark:border-zinc-800/50">
                {tasks.map(task => (
                    <div key={task.id} onClick={() => onTaskClick(task)} className="p-3 rounded-lg border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm cursor-pointer hover:shadow-md transition">
                        <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-tight">{task.stage}</span>
                            <span className="text-[10px] font-bold text-yellow-600">+{task.xpReward}</span>
                        </div>
                        <div className="font-medium text-sm mt-1">{task.title}</div>
                        {task.status === 'CHANGES_REQUESTED' && <div className="mt-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded inline-block">Правки</div>}
                        {task.status === 'REVIEW' && <div className="mt-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded inline-block">На проверке</div>}
                    </div>
                ))}
            </div>
        </div>
    )
}
