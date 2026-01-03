"use client";
import { useState, useEffect } from "react";
import { useCountry } from "@/shared/CountryContext";
import { useAuth } from "@/shared/AuthContext";

export type StudentFull = {
  id: string;
  fullName: string;
  email: string;
  countryId: string; // Legacy: for backward compatibility
  countryIds?: string[]; // NEW: Multi-country support
  countries?: Array<{ id: string; name: string; flag_icon: string }>; // NEW: Loaded countries
  xpTotal: number;
  password?: string;
  isActive: boolean;
  bindingCode: string;
  curatorId?: string;
  curatorName?: string;
  selectedProgramIds?: number[]; // NEW: Program selection
};

type Props = {
  student?: StudentFull | null;
  onClose: () => void;
  onSave: (data: Partial<StudentFull>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>; // <--- NEW
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function StudentModal({ student, onClose, onSave, onDelete }: Props) {
  const { countries, universities } = useCountry(); // Destructure universities
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEdit = !!student;

  // Куратор может редактировать своих, админ всех.
  // Упростим: дадим редактировать, если это админ или если это создание.
  // Или просто разрешим редактировать поля.
  const isViewOnly = !isAdmin && isEdit && student?.curatorId !== user?.curatorId;

  const [fullName, setFullName] = useState(student?.fullName || "");
  const [email, setEmail] = useState(student?.email || "");
  const [password, setPassword] = useState(student?.password || ""); // <--- State для пароля
  const [showPassword, setShowPassword] = useState(false); // <--- Глаз

  // Multi-country support: Use array of country IDs
  const [countryIds, setCountryIds] = useState<string[]>(() => {
    if (student?.countries && student.countries.length > 0) {
      return student.countries.map(c => c.id);
    }
    if (student?.countryIds && student.countryIds.length > 0) {
      return student.countryIds;
    }
    // Fallback to legacy countryId if available
    if (student?.countryId) {
      return [student.countryId];
    }
    // Default: select first country
    return countries[0]?.id ? [countries[0].id] : [];
  });

  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>(student?.selectedProgramIds || []);

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
        if (res.ok) {
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
      setPassword(student.password || "");

      // Initialize countryIds from student data
      if (student.countries && student.countries.length > 0) {
        setCountryIds(student.countries.map(c => c.id));
      } else if (student.countryIds && student.countryIds.length > 0) {
        setCountryIds(student.countryIds);
      } else if (student.countryId) {
        setCountryIds([student.countryId]);
      }
      setSelectedProgramIds(student.selectedProgramIds || []);


      setIsActive(student.isActive ?? true);
      setCuratorId(student.curatorId || "");
    } else {
      setFullName("");
      setEmail("");
      setPassword("");
      setCountryIds(countries[0]?.id ? [countries[0].id] : []);
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

    // Validate at least one country is selected
    if (countryIds.length === 0) {
      alert("Выберите хотя бы одну страну");
      return;
    }

    setLoading(true);

    const data: Partial<StudentFull> & { password?: string } = {
      fullName,
      email,
      password: password || undefined,
      countryIds, // Send array of country IDs
      isActive,
      curatorId: curatorId === "" ? undefined : curatorId,
      selectedProgramIds, // Include programs
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Email (Логин)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="relative">
                <label className="block text-xs text-zinc-500 mb-1">Пароль</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-10 font-mono`} // Added padding-right and font-mono
                  placeholder={!isEdit ? "Обязательно" : "Пароль скрыт"} // Changed placeholder
                  required={!isEdit}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-7 text-xs text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pwd = Math.random().toString(36).slice(-8);
                    setPassword(pwd);
                    setShowPassword(true);
                  }}
                  className="absolute right-9 top-7 text-xs text-zinc-400 hover:text-zinc-600 transform active:scale-95 transition-transform"
                  title="Сгенерировать пароль"
                >
                  🎲
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">
                  Страны обучения {countryIds.length > 0 && `(${countryIds.length})`}
                </label>
                <div className="border rounded p-3 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 space-y-2 max-h-40 overflow-y-auto">
                  {countries.map((c) => {
                    const isSelected = countryIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 p-1 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCountryIds([...countryIds, c.id]);
                            } else {
                              setCountryIds(countryIds.filter(id => id !== c.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          {c.flag_icon} {c.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {/* Show selected countries as pills */}
                {countryIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {countryIds.map((id) => {
                      const country = countries.find(c => c.id === id);
                      if (!country) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          {country.flag_icon} {country.name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Programs Selection Block */}
              {countryIds.length > 0 && (
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Выбранные программы</label>
                  <div className="border rounded p-3 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 space-y-4 max-h-60 overflow-y-auto text-sm">
                    {countryIds.map(cid => {
                      const country = countries.find(c => c.id === cid);
                      const countryUnis = universities.filter(u => u.countryId === cid);

                      if (countryUnis.length === 0) return null;

                      return (
                        <div key={cid} className="space-y-2">
                          <div className="flex items-center gap-2 font-bold text-xs bg-zinc-100 dark:bg-zinc-700/50 p-1 rounded">
                            <span>{country?.flag_icon}</span>
                            <span>{country?.name}</span>
                          </div>
                          <div className="pl-2 space-y-3">
                            {countryUnis.map(uni => (
                              <div key={uni.id}>
                                <div className="text-zinc-500 font-medium text-xs mb-1">{uni.logo_url} {uni.name}</div>
                                <div className="pl-2 space-y-1">
                                  {uni.programs && uni.programs.length > 0 ? uni.programs.map(prog => (
                                    <label key={prog.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 p-1 rounded">
                                      <input
                                        type="checkbox"
                                        className="w-3.5 h-3.5"
                                        checked={selectedProgramIds.includes(prog.id)}
                                        onChange={(e) => {
                                          if (e.target.checked) setSelectedProgramIds([...selectedProgramIds, prog.id]);
                                          else setSelectedProgramIds(selectedProgramIds.filter(id => id !== prog.id));
                                        }}
                                      />
                                      <span className="truncate" title={prog.title}>{prog.title}</span>
                                    </label>
                                  )) : (
                                    <div className="text-xs text-zinc-400 italic pl-1">Нет программ</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {countryIds.length > 0 && universities.filter(u => countryIds.includes(u.countryId)).length === 0 && (
                      <div className="text-center text-zinc-400 py-2">В выбранных странах нет добавленных университетов.</div>
                    )}
                  </div>
                </div>
              )}


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

          <div className="flex justify-between mt-6">
            {/* Кнопка удаления (только если редактирование и есть функция) */}
            {isEdit && student && onDelete ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Удалить студента и все его данные безвозвратно?")) {
                    await onDelete(student.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm"
              >
                Удалить
              </button>
            ) : <div></div>}

            <div className="flex gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
}
