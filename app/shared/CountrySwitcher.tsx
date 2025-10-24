"use client";
import { useCountry } from "./CountryContext";

export default function CountrySwitcher() {
  const { countries, selectedCountryId, setSelectedCountryId } = useCountry();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">Операция:</span>
      <select
        className="flex-1 rounded-xl border px-3 py-2 bg-white dark:bg-zinc-800"
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
    </div>
  );
}
