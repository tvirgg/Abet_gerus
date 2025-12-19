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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev: any) => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : (name === 'xpReward' ? Number(value) : value) 
    }));
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
              <label className="text-xs text-zinc-400">Название</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full mt-1 input-style" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs text-zinc-400">Этап (Stage)</label>
                   <input type="text" name="stage" value={formData.stage} onChange={handleChange} className="w-full mt-1 input-style" list="stages" />
                   <datalist id="stages">
                       <option value="Подготовка" />
                       <option value="Документы" />
                       <option value="Виза" />
                       <option value="Экзамены" />
                   </datalist>
                </div>
                <div>
                   <label className="text-xs text-zinc-400">Опыт (XP)</label>
                   <input type="number" name="xpReward" value={formData.xpReward} onChange={handleChange} className="w-full mt-1 input-style" />
                </div>
            </div>

            <div>
               <label className="text-xs text-zinc-400">Тип сдачи</label>
               <select name="submissionType" value={formData.submissionType || 'text'} onChange={handleChange} className="w-full mt-1 input-style appearance-none">
                   <option value="text">Текст</option>
                   <option value="file">Файл (PDF/Img)</option>
                   <option value="link">Ссылка</option>
                   <option value="none">Без ответа (Чекбокс)</option>
                   <option value="credentials">Доступы (Логин/Пароль)</option>
               </select>
            </div>

            <div>
               <label className="text-xs text-zinc-400">Дедлайн (текст или смещение)</label>
               <input 
                   type="text" 
                   name="deadline" 
                   value={formData.deadline || ''} 
                   onChange={handleChange} 
                   className="w-full mt-1 input-style" 
                   placeholder="Напр: 2026-05-01 или +30 дней" 
               />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Описание</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full mt-1 input-style" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-800">
               <input 
                   type="checkbox" 
                   name="isCritical" 
                   id="isCritical"
                   checked={formData.isCritical || false} 
                   onChange={handleChange} 
                   className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-red-600 focus:ring-red-500" 
               />
               <label htmlFor="isCritical" className="text-sm select-none cursor-pointer text-zinc-300">
                   Критическая задача (блокирует прогресс)
               </label>
            </div>

          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="btn bg-zinc-800 hover:bg-zinc-700 text-zinc-300">Отмена</button>
            <button type="submit" className="btn btn-primary">Сохранить</button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .input-style {
          border-radius: 0.5rem;
          border: 1px solid #3f3f46; /* zinc-700 */
          padding: 0.5rem 0.75rem;
          background-color: #18181b; /* zinc-900 */
          color: white;
          font-size: 0.875rem;
        }
        .input-style:focus {
          outline: 2px solid #3b82f6; /* blue-500 */
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
}
