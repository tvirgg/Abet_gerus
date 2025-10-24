"use client";
import { useState, useEffect } from "react";

type Props = {
  quest: any;
  onSave: (quest: any) => void;
  onClose: () => void;
};

export default function QuestEditModal({ quest, onSave, onClose }: Props) {
  const [formData, setFormData] = useState(quest);

  useEffect(() => {
    setFormData(quest);
  }, [quest]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: name === 'xp' ? Number(value) : value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg card p-6 bg-zinc-900" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold mb-4">Редактор Задачи</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm">Название</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full mt-1 input-style" />
            </div>
             <div>
              <label className="text-sm">Категория (Этап)</label>
              <input type="text" name="stage" value={formData.stage} onChange={handleChange} className="w-full mt-1 input-style" />
            </div>
            <div>
              <label className="text-sm">Описание</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full mt-1 input-style" />
            </div>
            <div>
              <label className="text-sm">Опыт (XP)</label>
              <input type="number" name="xp" value={formData.xp} onChange={handleChange} className="w-full mt-1 input-style" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="btn">Отмена</button>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .input-style {
          border-radius: 0.75rem;
          border: 1px solid #52525b; /* zinc-600 */
          padding: 0.5rem 0.75rem;
          background-color: #27272a; /* zinc-800 */
          color: white;
        }
        .input-style:focus {
          outline: 2px solid #3b82f6; /* blue-500 */
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
