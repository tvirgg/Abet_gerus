"use client";
import { useState } from "react";
import { useCountry } from "@/shared/CountryContext";

type Props = {
  student: any;
  onClose: () => void;
  onSave: (data: any) => void;
};

export default function EditProfileModal({ student, onClose, onSave }: Props) {
  const { countries } = useCountry();
  const [formData, setFormData] = useState({
      fullName: student.fullName,
      countryId: student.countryId
  });

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md card p-6 bg-zinc-900">
        <h2 className="text-lg font-bold mb-4">Редактировать профиль</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm">ФИО</label>
                <input 
                    value={formData.fullName} 
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full mt-1 p-2 rounded bg-zinc-800 border border-zinc-700"
                />
            </div>
            <div>
                <label className="text-sm">Страна</label>
                <select 
                    value={formData.countryId}
                    onChange={e => setFormData({...formData, countryId: e.target.value})}
                    className="w-full mt-1 p-2 rounded bg-zinc-800 border border-zinc-700"
                >
                    {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={onClose} className="btn">Отмена</button>
                <button type="submit" className="btn btn-primary">Сохранить</button>
            </div>
        </form>
      </div>
    </div>
  );
}
