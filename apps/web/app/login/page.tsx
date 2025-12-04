 "use client";
import { useAuth } from "@/shared/AuthContext";
 import { useRouter } from "next/navigation";
 import { useEffect, useState } from "react";

 export default function LoginPage() {
   const auth = useAuth();
   const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "curator" | "admin">("student");
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);

   useEffect(() => {
     // Если пользователь уже залогинен, перенаправляем его
     if (auth.user) {
       const role = auth.user.role.toLowerCase();
       if (role === "student") {
           router.replace("/student/dashboard");
       } else {
           router.replace("/curator/dashboard");
       }
     }
   }, [auth.user, router]);

  const handleLogin = async () => {
    if (!email || !password) {
        setRegisterMessage("Введите email и пароль");
        return;
    }
    try {
        setRegisterLoading(true);
        await auth.login(email, password);
    } catch (e: any) {
        setRegisterMessage(e.message);
    } finally {
        setRegisterLoading(false);
    }
  };

   const handleRegister = async (e: React.FormEvent) => {
     e.preventDefault();
     setRegisterMessage(null);

     try {
       setRegisterLoading(true);
       await auth.register({ email, password, role });
     } catch (err: any) {
       setRegisterMessage(err.message || "Не удалось выполнить регистрацию");
     } finally {
       setRegisterLoading(false);
     }
   };

   return (
     <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
       <div className="w-full max-w-sm rounded-2xl shadow p-8 bg-white dark:bg-zinc-900">
         {/* Форма регистрации/входа */}
         <div className="pt-4 mt-2">
           <h2 className="text-sm font-semibold mb-2 text-zinc-800 dark:text-zinc-100">
             Вход / Регистрация
           </h2>
           <form className="space-y-3" onSubmit={handleRegister}>
             <div>
               <label className="block text-xs text-zinc-500 mb-1">Email</label>
               <input
                 type="email"
                 className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-800"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-xs text-zinc-500 mb-1">Пароль</label>
               <input
                 type="password"
                 className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-800"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-xs text-zinc-500 mb-1">Роль (для регистрации)</label>
               <select
                 className="w-full rounded-xl border px-3 py-2 bg-white dark:bg-zinc-800"
                 value={role}
                 onChange={(e) => setRole(e.target.value as any)}
               >
                 <option value="student">Студент</option>
                 <option value="curator">Куратор</option>
                 <option value="admin">Администратор</option>
               </select>
             </div>
             <div className="flex gap-2">
                 <button
                 type="button"
                 onClick={handleLogin}
                 disabled={registerLoading}
                 className="flex-1 rounded-2xl py-2.5 font-medium border border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                 >
                 Войти
                 </button>
                 <button
                 type="submit"
                 disabled={registerLoading}
                 className="flex-1 rounded-2xl py-2.5 font-medium bg-blue-600 text-white disabled:bg-blue-300"
                 >
                 Регистрация
                 </button>
             </div>
           </form>
           {registerMessage && (
             <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
               {registerMessage}
             </p>
           )}
         </div>
       </div>
     </div>
   );
 }
