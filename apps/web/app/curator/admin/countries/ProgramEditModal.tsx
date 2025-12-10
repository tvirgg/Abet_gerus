"use client";
import { useState, useEffect } from "react";

type Props = {
  program?: any;
  universityId: string;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
};

const CATEGORIES = ["IT", "Business", "Engineering", "Arts/Design", "Law", "Medicine", "Science", "Humanities"];

export default function ProgramEditModal({ program, universityId, onSave, onClose }: Props) {
  const [formData, setFormData] = useState({
    title: "",
    category: "IT", // Default
    deadline: "",
    link: "",
    imageUrl: "",
    universityId: universityId
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (program) {
      setFormData({
        title: program.title,
        category: program.category || "IT", // Load existing
        deadline: program.deadline,
        link: program.link || "",
        imageUrl: program.imageUrl || "",
        universityId: program.university?.id || universityId
      });
    }
  }, [program]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ ...formData, id: program?.id });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full mt-1 p-2 rounded bg-zinc-800 border border-zinc-700 text-sm";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md card p-6 bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{program ? "Редактировать программу" : "Новая программа"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Название (Специальность)</label>
            <input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              className={inputClass}
              required
              placeholder="Computer Science, Architecture..."
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Категория</label>
            <select
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className={inputClass}
            >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Дедлайн</label>
            <input 
              type="date"
              value={formData.deadline} 
              onChange={e => setFormData({...formData, deadline: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Ссылка на описание</label>
            <input 
              value={formData.link} 
              onChange={e => setFormData({...formData, link: e.target.value})}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">URL картинки</label>
            <input 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="btn bg-zinc-800 text-zinc-300">Отмена</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? "..." : "Сохранить"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
