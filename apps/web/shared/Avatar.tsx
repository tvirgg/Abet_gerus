import { useMemo } from "react";

type Props = {
  name: string;
  level: number;
  className?: string;
};

export default function Avatar({ name, level, className = "w-16 h-16" }: Props) {
  // Генерируем стабильные цвета на основе имени
  const colors = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return {
      bg: `hsl(${hue}, 70%, 85%)`,
      text: `hsl(${hue}, 80%, 30%)`,
      accent: `hsl(${(hue + 45) % 360}, 80%, 60%)`
    };
  }, [name]);

  return (
    <div className={`relative rounded-full flex items-center justify-center font-bold shadow-inner ${className}`} style={{ backgroundColor: colors.bg, color: colors.text }}>
      <div className="z-10 text-xl">
        {name[0]?.toUpperCase()}
      </div>
      
      {/* Декоративное кольцо уровня */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="text-white/40"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          style={{ color: colors.accent }}
          strokeDasharray={`${Math.min(level * 10, 100)}, 100`}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
      
      {/* Бейдж уровня */}
      <div className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900">
        {level}
      </div>
    </div>
  );
}
