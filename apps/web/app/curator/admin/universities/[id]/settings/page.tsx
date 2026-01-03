"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCountry } from "../../../../../../shared/CountryContext";
import QuestEditModal from "../../../countries/QuestEditModal"; // Reusing existing modal

// Helpers
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function UniversitySettingsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string; // University ID (string UUID)

    const { universities, countries, refreshData } = useCountry();

    // Local State
    const [university, setUniversity] = useState<any>(null);
    const [countryTasks, setCountryTasks] = useState<any[]>([]);
    const [universityTasks, setUniversityTasks] = useState<any[]>([]);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Resolve University and Country
    useEffect(() => {
        if (universities.length > 0 && id) {
            const uni = universities.find((u: any) => u.id === id);
            if (uni) {
                setUniversity(uni);
            }
        }
    }, [universities, id]);

    // 2. Fetch Tasks (Hierarchy)
    useEffect(() => {
        if (!university) return;

        const fetchTasks = async () => {
            setIsLoading(true);
            const token = localStorage.getItem("accessToken");
            try {
                // Fetch Country Tasks (Level 1)
                const resCountry = await fetch(`${API_URL}/admin/hierarchy/country/${university.countryId}/tasks`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resCountry.ok) setCountryTasks(await resCountry.json());

                // Fetch University Tasks (Level 2)
                const resUni = await fetch(`${API_URL}/admin/hierarchy/university/${university.id}/tasks`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resUni.ok) setUniversityTasks(await resUni.json());

            } catch (e) {
                console.error("Failed to load tasks", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [university]);


    // Helper: Save Task (University Level)
    const handleSaveTask = async (task: any) => {
        const token = localStorage.getItem("accessToken");

        // Ensure specific context is set
        const payload = {
            ...task,
            universityId: university.id,
            countryId: null, // Ensure purely university level
            programId: null
        };

        if (task.id && task.id > 0) {
            // Update
            await fetch(`${API_URL}/admin/task-templates`, { // Assuming POST handles upsert or separate PATCH?
                // Actually admin.controller has POST for create, DELETE for delete. No PATCH?
                // AdminService.createTaskTemplate uses .save() which upserts if ID present.
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
        } else {
            // Create
            delete payload.id;
            await fetch(`${API_URL}/admin/task-templates`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
        }

        // Refresh local list
        const resUni = await fetch(`${API_URL}/admin/hierarchy/university/${university.id}/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (resUni.ok) setUniversityTasks(await resUni.json());

        setIsTaskModalOpen(false);
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm("Удалить задачу?")) return;
        const token = localStorage.getItem("accessToken");
        await fetch(`${API_URL}/admin/task-templates/${taskId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        setUniversityTasks(prev => prev.filter(t => t.id !== taskId));
    };


    if (!university) return <div className="p-8 text-zinc-500">Загрузка университета...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-6">
                <button onClick={() => router.back()} className="btn btn-ghost text-zinc-400">← Назад</button>
                <div className="text-4xl">{university.logoUrl || '🏛️'}</div>
                <div>
                    <h1 className="text-2xl font-bold">{university.name}</h1>
                    <p className="text-zinc-500 text-sm">Настройки университета и задач</p>
                </div>
            </div>

            {/* Block 1: Inherited Country Tasks */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        🌍 Общие задачи страны
                        <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">Read-only</span>
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                    {countryTasks.map(task => (
                        <div key={task.id} className="card p-4 border border-dashed border-zinc-700 bg-zinc-900/50">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-blue-400 uppercase tracking-wider font-bold">{task.stage}</span>
                                <span className="text-xs text-zinc-500">+{task.xpReward} XP</span>
                            </div>
                            <h3 className="font-medium text-zinc-200">{task.title}</h3>
                            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{task.description}</p>
                        </div>
                    ))}
                    {countryTasks.length === 0 && <p className="text-zinc-600 text-sm italic">Нет общих задач для этой страны.</p>}
                </div>
            </div>

            {/* Block 2: University Tasks */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-blue-400">🏛️ Задачи Университета</h2>
                    <button
                        onClick={() => { setEditingTask({}); setIsTaskModalOpen(true); }}
                        className="btn btn-primary text-sm"
                    >
                        + Добавить задачу
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {universityTasks.map(task => (
                        <div key={task.id} className="card p-4 bg-zinc-900 border border-zinc-700 hover:border-blue-500 transition group relative">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-green-400 uppercase tracking-wider font-bold">{task.stage}</span>
                                <span className="text-xs text-zinc-500">+{task.xpReward} XP</span>
                            </div>
                            <h3 className="font-medium text-white">{task.title}</h3>
                            <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{task.description}</p>

                            {/* Actions */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                                <button onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }} className="p-1 bg-zinc-800 rounded hover:bg-blue-600 text-xs">✏️</button>
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 bg-zinc-800 rounded hover:bg-red-600 text-xs">🗑️</button>
                            </div>
                        </div>
                    ))}
                    {universityTasks.length === 0 && (
                        <div className="col-span-full py-8 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500">
                            У этого университета нет специальных задач.
                            <br />Студенты получат только задачи страны.
                        </div>
                    )}
                </div>
            </div>

            {/* Block 3: Programs (Simplified List) */}
            <div className="space-y-4 pt-8 border-t border-zinc-800">
                <h2 className="text-lg font-semibold">📚 Программы ({university.programs?.length || 0})</h2>
                <div className="space-y-2">
                    {university.programs?.map((prog: any) => (
                        <div key={prog.id} className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                            <div>
                                <div className="text-xs text-zinc-500 uppercase">{prog.category || 'General'}</div>
                                <div className="font-medium">{prog.title}</div>
                            </div>
                            <div className="text-sm text-zinc-400">
                                {prog.deadline ? new Date(prog.deadline).toLocaleDateString() : 'No deadline'}
                            </div>
                        </div>
                    ))}
                    {(!university.programs || university.programs.length === 0) && <p className="text-zinc-500">Нет программ.</p>}
                </div>
            </div>

            {/* Modal */}
            {isTaskModalOpen && (
                <QuestEditModal
                    quest={editingTask}
                    onSave={handleSaveTask}
                    onClose={() => setIsTaskModalOpen(false)}
                />
            )}
        </div>
    );
}
