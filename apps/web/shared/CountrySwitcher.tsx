"use client";
import { useCountry } from "./CountryContext";

export default function CountrySwitcher() {
  const { countries, selectedCountryId, setSelectedCountryId } = useCountry();
  return (
    <div className="relative group">
       <select
        className="w-full appearance-none rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 px-3 py-1.5 bg-transparent text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
         value={selectedCountryId}
         onChange={(e) => setSelectedCountryId(e.target.value)}
         aria-label="Переключатель страны"
       >
         {countries.map((c) => (
           <option key={c.id} value={c.id}>
             {c.flag_icon} {c.name}
           </option>
         ))}
       </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-zinc-400">▼</div>
     </div>
   );

}
