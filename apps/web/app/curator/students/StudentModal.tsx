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
};

type Props = {
  student?: StudentFull | null;
  onClose: () => void;
  onSave: (data: Partial<StudentFull>) => Promise<void>;
};

export default function StudentModal({ student, onClose, onSave }: Props) {
  const { countries } = useCountry();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEdit = !!student;
  const isViewOnly = !isAdmin && isEdit; // For curators, view only when editing

  const [fullName, setFullName] = useState(student?.fullName || "");
  const [email, setEmail] = useState(student?.email || "");
  const [countryId, setCountryId] = useState(student?.countryId || countries[0]?.id || "");
  const [isActive, setIsActive] = useState(student?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setEmail(student.email);
      setCountryId(student.countryId);
      setIsActive(student.isActive ?? true);
    } else {
      setFullName("");
      setEmail("");
      setCountryId(countries[0]?.id || "");
      setIsActive(true);
    }
  }, [student, countries]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin || isViewOnly) return; // Don't save in view only

    setLoading(true);
    const data: Partial<StudentFull> = {
      fullName,
      email,
      countryId,
      isActive,
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

  const inputClass = "w-full p-2 border rounded dark:bg-zinc-800 disabled:bg-zinc-700 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isViewOnly ? "Профиль студента" : isEdit ? "Редактировать студента" : "Новый студент"}
          </h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <form onSubmit={!isViewOnly ? handleSubmit : undefined}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Полное имя</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isViewOnly}
                required={!isViewOnly}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isViewOnly}
                required={!isViewOnly}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Страна</label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                disabled={isViewOnly}
                required={!isViewOnly}
                className={inputClass}
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flag_icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isViewOnly}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm">Активен</label>
            </div>
            {isEdit && (
              <div className="text-sm text-zinc-500">
                <p>XP: {student!.xpTotal}</p>
                <p>Код привязки: {student!.bindingCode}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
              disabled={loading}
            >
              Закрыть
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
