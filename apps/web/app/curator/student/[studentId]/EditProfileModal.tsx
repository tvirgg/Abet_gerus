"use client";
import { useState, useEffect } from "react";
import { useCountry, Program } from "@/shared/CountryContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Props = {
  student: any;
  onClose: () => void;
  onSave: (data: any) => void;
};

export default function EditProfileModal({ student, onClose, onSave }: Props) {
  const { countries, universities } = useCountry();
  const [availablePrograms, setAvailablePrograms] = useState<Program[]>([]);
  const [loadingProgs, setLoadingProgs] = useState(false);

  const [formData, setFormData] = useState({
      fullName: student.fullName,
      countryId: student.countryId ? Number(student.countryId) : undefined,
      // ИСПРАВЛЕНИЕ: Добавлен тип (id: any)
      selectedProgramIds: (student.selectedProgramIds || []).map((id: any) => Number(id))
  });

  // Загружаем программы для выбранной страны
  useEffect(() => {
      if (formData.countryId) {
          setLoadingProgs(true);
          const token = localStorage.getItem("accessToken");
          fetch(`${API_URL}/admin/programs/search?countryId=${formData.countryId}`, {
              headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
              setAvailablePrograms(Array.isArray(data) ? data : []);
          })
          .finally(() => setLoadingProgs(false));
      } else {
          setAvailablePrograms([]);
      }
  }, [formData.countryId]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
  };

  const toggleProgram = (progId: number) => {
      setFormData(prev => {
          const current = new Set(prev.selectedProgramIds);
          if (current.has(progId)) current.delete(progId);
          else current.add(progId);
          return { ...prev, selectedProgramIds: Array.from(current) };
      });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <h2 className="text-xl font-bold">Настройка профиля</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition text-2xl">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs text-zinc-400 font-medium ml-1">ФИО Студента</label>
                    <input 
                        value={formData.fullName} 
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                        className="w-full mt-1 p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-sm focus:border-blue-500 focus:outline-none"
                    />
                </div>
                
                <div>
                    <label className="text-xs text-zinc-400 font-medium ml-1">Страна поступления</label>
                    <select 
                        value={formData.countryId || ''}
                        onChange={e => setFormData({
                            ...formData, 
                            countryId: e.target.value ? Number(e.target.value) : undefined,
                            selectedProgramIds: [] // Сброс программ при смене страны
                        })}
                        className="w-full mt-1 p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-sm focus:border-blue-500 focus:outline-none"
                    >
                        {countries.map(c => <option key={c.id} value={c.id}>{c.flag_icon} {c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs text-zinc-400 font-medium ml-1 mb-2 block">
                        Целевые программы {loadingProgs && <span className="animate-pulse ml-2">Загрузка...</span>}
                    </label>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {availablePrograms.length > 0 ? availablePrograms.map(prog => {
                             const uniName = universities.find(u => u.id === prog.university_id || u.id === (prog as any).university?.id)?.name || "ВУЗ";
                             const isSelected = formData.selectedProgramIds.includes(prog.id);
                             
                             return (
                                <div 
                                    key={prog.id} 
                                    onClick={() => toggleProgram(prog.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                                        isSelected 
                                        ? 'bg-blue-900/20 border-blue-500/50' 
                                        : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-500'
                                    }`}
                                >
                                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-zinc-600'}`}>
                                        {isSelected && <span className="text-xs text-white">✓</span>}
                                    </div>
                                    <div>
                                        <div className={`font-medium text-sm ${isSelected ? 'text-blue-100' : 'text-zinc-300'}`}>{prog.title}</div>
                                        <div className="text-xs text-zinc-500 mt-0.5">{uniName}</div>
                                    </div>
                                </div>
                             );
                        }) : (
                            <div className="text-center py-4 text-zinc-500 text-sm bg-zinc-800/30 rounded-xl border border-dashed border-zinc-700">
                                Программы для этой страны не найдены
                            </div>
                        )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 ml-1">
                        * При добавлении программы студенту автоматически назначатся её специфические задачи.
                    </p>
                </div>
            </form>
        </div>

        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Отмена</button>
            <button type="submit" form="edit-student-form" className="btn btn-primary">Сохранить изменения</button>
        </div>
      </div>
    </div>
  );
}