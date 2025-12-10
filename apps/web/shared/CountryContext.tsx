"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import questTemplates from "@/mock/quest_templates.json";
import docTemplates from "@/mock/document_templates.json";
import universityTemplates from "@/mock/universities.json";
import programTemplates from "@/mock/programs.json";
import { useAuth } from "./AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type CountryProfile = {
  id: string;
  name: string;
  flag_icon: string;
  required_document_ids: number[];
  required_quest_ids: number[];
};

export type QuestTemplate = {
  id: number;
  countryId?: number;
  universityId?: number;
  stage: string;
  title: string;
  xpReward: number; // Renamed from xp
  description: string;
  deadline: string;
  links_to_document_id: number | null;
};

export type DocumentTemplate = {
  id: number;
  category: string;
  title: string;
};

// --- НОВОЕ: Добавлены типы для университетов и программ ---
export type University = {
  id: string;
  name: string;
  logo_url: string;
  program_ids: number[];
  countryId: string;
};

export type Program = {
  id: number;
  title: string;
  category?: string; // <--- Добавлено поле
  university_id: string;
  deadline: string;
  link: string;
  image_url: string;
  required_document_ids: number[];
};

type Ctx = {
  countries: CountryProfile[];
  selectedCountryId: string;
  setSelectedCountryId: (id: string) => void;
  selectedCountry: CountryProfile | undefined;
  quests: QuestTemplate[];
  documents: DocumentTemplate[];
  universities: University[];
  programs: Program[];
  refreshData: () => Promise<void>;
};

const CountryCtx = createContext<Ctx | null>(null);

function readOverrides(): CountryProfile[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("countriesOverride");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CountryProfile[];
    return null;
  } catch {
    return null;
  }
}

export const CountryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user } = useAuth();
  const [countries, setCountries] = useState<CountryProfile[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [quests, setQuests] = useState<QuestTemplate[]>([]);
  const [selectedCountryId, setSelectedCountryIdState] = useState<string>("");

  const refreshData = async () => {
      const token = localStorage.getItem("accessToken");
      // Явно указываем тип, чтобы TS не ругался на несовместимость с HeadersInit
      const headers: Record<string, string> = {};
      if (token) {
          headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const [resC, resU, resQ] = await Promise.all([
            fetch(`${API_URL}/countries`, { headers }),
            fetch(`${API_URL}/admin/universities`, { headers }),
            fetch(`${API_URL}/admin/task-templates`, { headers })
        ]);

        if (resC.ok) {
             const cData = await resC.json();
             setCountries(cData.map((c: any) => ({
                 id: c.id, name: c.name, flag_icon: c.flagIcon,
                 required_document_ids: [], required_quest_ids: [] 
             })));
        }
        if (resU.ok) {
            const uData = await resU.json();
            setUniversities(uData.map((u: any) => ({
                id: u.id, name: u.name, logo_url: u.logoUrl || '🎓', program_ids: [], countryId: u.countryId
            })));
        }
        if (resQ.ok) {
            const qData = await resQ.json();
            setQuests(qData);
        }
      } catch (e) {
          console.error("Failed to load data", e);
      }
  };

  useEffect(() => {
      refreshData();
  }, [user]);

  useEffect(() => {
      if (countries.length > 0 && !selectedCountryId) {
          if (user?.countryId) {
              setSelectedCountryIdState(user.countryId);
          } else {
              setSelectedCountryIdState(countries[0].id);
          }
      }
  }, [countries, user]);

  const setSelectedCountryId = (id: string) => {
    setSelectedCountryIdState(id);
  };

  const selectedCountry = useMemo(
    () => countries.find((c) => c.id === selectedCountryId),
    [countries, selectedCountryId]
  );

  // Используем any для расширения типа контекста в рантайме, либо нужно обновить тип Ctx выше
  const value: any = {
    countries,
    selectedCountryId,
    setSelectedCountryId,
    selectedCountry,
    quests, // Теперь динамические квесты
    documents: docTemplates as DocumentTemplate[],
    universities, // Теперь динамические вузы
    programs: programTemplates as Program[],
    refreshData, // Экспортируем функцию обновления
  };

  return <CountryCtx.Provider value={value}>{children}</CountryCtx.Provider>;
};

export function useCountry() {
  const ctx = useContext(CountryCtx);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
