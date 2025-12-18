"use client";
import { useState, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Props = {
  moderator?: any | null; // Если null - режим создания
  onClose: () => void;
  onSave: (data: any) => Promise<any>;
  onDelete?: (id: string) => Promise<void>;
 };

 export default function ModeratorModal({ moderator, onClose, onSave, onDelete }: Props) {
  const [formData, setFormData] = useState({
      email: "",
      fullName: "",
      specialization: "",
      bio: "",
      avatarUrl: "",
      isActive: true,
      password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (moderator) {
      setFormData({
          email: moderator.email,
          fullName: moderator.curator?.fullName || "",
          specialization: moderator.curator?.specialization || "",
          bio: moderator.curator?.bio || "",
          avatarUrl: moderator.curator?.avatarUrl || "",
          isActive: moderator.isActive,
          password: moderator.password || "" // <--- Подставляем пароль
      });
    }
  }, [moderator]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${API_URL}/files/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        if(res.ok) {
            const data = await res.json();
            setFormData(prev => ({ ...prev, avatarUrl: data.url }));
        }
    } catch (err) {
        alert("Ошибка загрузки");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: any = { ...formData, id: moderator?.id };
      if (!payload.password) delete payload.password;

      const result = await onSave(payload);
      
      if (!moderator && result?.generatedPassword) {
        setCreatedPassword(result.generatedPassword);
      } else {
        onClose();
      }
    } catch (err) {
      alert("Ошибка сохранения");
    } finally {
      setIsLoading(false);
    }
  };

  if (createdPassword) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md card p-6 bg-zinc-900 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-bold mb-2">Куратор создан</h3>
          <p className="text-zinc-400 mb-4">Скопируйте пароль и передайте сотруднику:</p>
          
          <div className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 font-mono text-xl select-all mb-6 text-green-400">
            {createdPassword}
          </div>

          <button onClick={onClose} className="btn btn-primary w-full">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="w-full max-w-lg card p-6 bg-zinc-900 my-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
                {moderator ? "Редактировать профиль" : "Новый куратор"}
            </h2>
            <button onClick={onClose} className="text-2xl leading-none">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 cursor-pointer hover:border-blue-500 transition relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                  {formData.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-2xl text-zinc-500">📷</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span className="text-xs text-white">Изменить</span>
                  </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
              <div className="text-sm text-zinc-500">
                  Нажмите на фото, чтобы загрузить аватар.
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-400">ФИО</label>
                <input
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full mt-1 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Специализация</label>
                <input
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="w-full mt-1 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
                  placeholder="Визы, США"
                />
              </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Email (Логин)</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full mt-1 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
              placeholder="curator@abbit.com"
            />
          </div>

           <div>
            <label className="text-xs text-zinc-400">Пароль</label>
            <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full mt-1 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm font-mono pr-8"
                  placeholder={moderator ? "Текущий пароль" : "Пароль"}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                >
                    {showPassword ? "🙈" : "👁️"}
                </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">О себе</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full mt-1 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-sm"
              rows={3}
            />
          </div>

          {moderator && (
            <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl">
              <input
                type="checkbox"
                id="active"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 rounded"
              />
              <label htmlFor="active" className="text-sm cursor-pointer select-none">
                Активный аккаунт (доступ разрешен)
              </label>
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            {moderator && onDelete ? (
                <button 
                    type="button"
                    onClick={async () => {
                        if(confirm("Удалить куратора безвозвратно?")) {
                            await onDelete(moderator.id);
                            onClose();
                        }
                    }}
                    className="btn bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-3"
                >
                    Удалить
                </button>
            ) : <div></div>}
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="btn bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-300">
                Отмена
                </button>
                <button type="submit" disabled={isLoading} className="btn btn-primary">
                {isLoading ? "Сохранение..." : moderator ? "Сохранить" : "Создать"}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
