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
  stage: string;
  title: string;
  xp: number;
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
};

export type Program = {
  id: number;
  title: string;
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
  const [selectedCountryId, setSelectedCountryIdState] = useState<string>("");

  useEffect(() => {
      // Fetch countries from API
      fetch(`${API_URL}/countries`)
        .then(r => r.json())
        .then(data => {
            // Map API response to CountryProfile format if needed
            const mapped = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                flag_icon: c.flagIcon,
                required_document_ids: c.requiredDocumentIds || [],
                required_quest_ids: c.requiredQuestIds || []
            }));
            setCountries(mapped);
            
            // Set default country from User profile if available
            if (user?.countryId) {
                setSelectedCountryIdState(user.countryId);
            } else if (mapped.length > 0) {
                setSelectedCountryIdState(mapped[0].id);
            }
        })
        .catch(console.error);
  }, [user]);

  const setSelectedCountryId = (id: string) => {
    setSelectedCountryIdState(id);
    if (typeof window !== "undefined") localStorage.setItem("selectedCountryId", id);
  };

  const selectedCountry = useMemo(
    () => countries.find((c) => c.id === selectedCountryId),
    [countries, selectedCountryId]
  );

  const value: Ctx = {
    countries,
    selectedCountryId,
    setSelectedCountryId,
    selectedCountry,
    quests: questTemplates as QuestTemplate[],
    documents: docTemplates as DocumentTemplate[],
    universities: universityTemplates as University[],
    programs: programTemplates as Program[],
  };

  return <CountryCtx.Provider value={value}>{children}</CountryCtx.Provider>;
};

export function useCountry() {
  const ctx = useContext(CountryCtx);
  if (!ctx) throw new Error("useCountry must be used within CountryProvider");
  return ctx;
}
