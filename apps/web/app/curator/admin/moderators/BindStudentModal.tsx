"use client";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type StudentSimple = {
  id: string;
  fullName: string;
  countryId: string;
};

type Props = {
  moderatorId: string; // ID пользователя-модератора
  onClose: () => void;
  onSuccess: () => void;
};

export default function BindStudentModal({ moderatorId, onClose, onSuccess }: Props) {
  const [students, setStudents] = useState<StudentSimple[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchFreeStudents = async () => {
      const token = localStorage.getItem("accessToken");
      try {
        const res = await fetch(`${API_URL}/admin/students/unassigned`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setStudents(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFreeStudents();
  }, []);

  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${API_URL}/admin/moderators/${moderatorId}/assign-students`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentIds: Array.from(selectedIds) })
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Ошибка привязки");
      }
    } catch (e) {
      alert("Ошибка сети");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold">Привязать студентов</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-black dark:hover:text-white">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-zinc-500">Загрузка...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">Нет свободных студентов</div>
          ) : (
            <div className="space-y-1">
              {students.map(s => {
                const isSelected = selectedIds.has(s.id);
                return (
                  <div 
                    key={s.id} 
                    onClick={() => toggleStudent(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                      isSelected 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500" 
                      : "bg-transparent border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-blue-500 border-blue-500" : "border-zinc-400"}`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                    <div>
                        <div className="font-medium text-sm">{s.fullName}</div>
                        <div className="text-xs text-zinc-500 uppercase">{s.countryId}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-zinc-500">Выбрано: {selectedIds.size}</span>
            <button 
                onClick={handleSubmit} 
                disabled={submitting || selectedIds.size === 0}
                className="btn btn-primary text-sm px-6"
            >
                {submitting ? "Сохранение..." : "Привязать"}
            </button>
        </div>
      </div>
    </div>
  );
}
