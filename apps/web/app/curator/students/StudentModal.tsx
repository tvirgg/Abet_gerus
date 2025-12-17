"use client";
import { useState, useEffect } from "react";
import { useCountry } from "@/shared/CountryContext";
import { useAuth } from "@/shared/AuthContext";

export type StudentFull = {
  id: string;
  fullName: string;
  email: string;
  countryId: string;
  xpTotal: number;
  isActive: boolean;
  bindingCode: string;
  curatorId?: string; // Новое поле
  curatorName?: string; // Новое поле
};

type Props = {
  student?: StudentFull | null;
  onClose: () => void;
  onSave: (data: Partial<StudentFull>) => Promise<void>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function StudentModal({ student, onClose, onSave }: Props) {
  const { countries } = useCountry();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEdit = !!student;
  
  // Куратор может редактировать своих, админ всех.
  // Упростим: дадим редактировать, если это админ или если это создание.
  // Или просто разрешим редактировать поля.
  const isViewOnly = !isAdmin && isEdit && student?.curatorId !== user?.curatorId; 

  const [fullName, setFullName] = useState(student?.fullName || "");
  const [email, setEmail] = useState(student?.email || "");
  const [countryId, setCountryId] = useState(student?.countryId || countries[0]?.id || "");
  const [isActive, setIsActive] = useState(student?.isActive ?? true);
  const [curatorId, setCuratorId] = useState(student?.curatorId || "");
  
  const [curators, setCurators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Загружаем список кураторов для дропдауна
  useEffect(() => {
     const fetchCurators = async () => {
         const token = localStorage.getItem("accessToken");
         try {
             const res = await fetch(`${API_URL}/admin/moderators`, {
                 headers: { Authorization: `Bearer ${token}` }
             });
             if(res.ok) {
                 const data = await res.json();
                 setCurators(data.curators);
             }
         } catch (e) { console.error(e); }
     };
     fetchCurators();
  }, []);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setEmail(student.email);
      setCountryId(student.countryId);
      setIsActive(student.isActive ?? true);
      setCuratorId(student.curatorId || "");
    } else {
      setFullName("");
      setEmail("");
      setCountryId(countries[0]?.id || "");
      setIsActive(true);
      // Если создает куратор, ставим его сразу
      if (user?.role === 'curator' && user.curatorId) {
          setCuratorId(user.curatorId);
      } else {
          setCuratorId("");
      }
    }
  }, [student, countries, user]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    const data: Partial<StudentFull> = {
      fullName,
      email,
      countryId,
      isActive,
      curatorId: curatorId === "" ? undefined : curatorId,
    };
    
    if (isEdit) {
      data.id = student!.id;
    }
    
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-2 border rounded bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 disabled:opacity-50";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEdit ? "Редактировать студента" : "Новый студент"}
          </h2>
          <button onClick={onClose} className="text-2xl text-zinc-500">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Полное имя</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Страна</label>
                    <select
                        value={countryId}
                        onChange={(e) => setCountryId(e.target.value)}
                        className={inputClass}
                    >
                        {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.flag_icon} {c.name}
                        </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs text-zinc-500 mb-1">Куратор</label>
                    <select
                        value={curatorId}
                        onChange={(e) => setCuratorId(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">-- Нет --</option>
                        {curators.map((c) => (
                        <option key={c.id} value={c.curator?.id}>
                            {c.curator?.fullName || c.email}
                        </option>
                        ))}
                    </select>
                </div>
            </div>
            
            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mr-2 w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm">Активный аккаунт</label>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
