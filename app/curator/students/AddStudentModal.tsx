"use client";
import { useCountry } from "@/app/shared/CountryContext";
import { useMemo, useState } from "react";
import type { Student } from "./page";

type Props = {
  onClose: () => void;
  onSave: (data: Omit<Student, 'id'>) => void;
};

export default function AddStudentModal({ onClose, onSave }: Props) {
  const { countries, universities, quests } = useCountry();

  // Состояние для всего процесса
  const [currentStep, setCurrentStep] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState(countries[0]?.id || "");
  const [selectedUniversityIds, setSelectedUniversityIds] = useState<string[]>([]);
  const [selectedQuestIds, setSelectedQuestIds] = useState<number[]>([]);
  // --- НОВОЕ: Состояние для кастомных задач ---
  const [customQuests, setCustomQuests] = useState<{ id: number; title: string }[]>([]);
  const [newCustomQuestTitle, setNewCustomQuestTitle] = useState("");

  // Фильтруем квесты на основе выбранной страны
  const availableQuests = useMemo(() => {
    const country = countries.find(c => c.id === selectedCountryId);
    if (!country) return [];
    const requiredIds = new Set(country.required_quest_ids);
    return quests.filter(q => requiredIds.has(q.id));
  }, [selectedCountryId, countries, quests]);

  // --- НОВОЕ: Логика для добавления и удаления кастомных задач ---
  const handleAddCustomQuest = () => {
    if (!newCustomQuestTitle.trim()) return;
    const newId = -Date.now(); // Уникальный отрицательный ID
    const newQuest = { id: newId, title: newCustomQuestTitle.trim() };

    setCustomQuests(prev => [...prev, newQuest]);
    setSelectedQuestIds(prev => [...prev, newId]); // Автоматически выбираем новую задачу
    setNewCustomQuestTitle(""); // Сбрасываем поле ввода
  };

  const handleRemoveCustomQuest = (idToRemove: number) => {
    setCustomQuests(prev => prev.filter(q => q.id !== idToRemove));
    setSelectedQuestIds(prev => prev.filter(id => id !== idToRemove));
  };

  const handleNext = () => {
    if (currentStep === 1 && !studentName) {
      alert("Пожалуйста, введите имя студента.");
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSave = () => {
    onSave({
      name: studentName,
      countryId: selectedCountryId,
      assignedUniversityIds: selectedUniversityIds,
      assignedQuestIds: selectedQuestIds,
      customQuests: customQuests,
    });
  };

  // --- Функции для рендеринга каждого шага ---

  const renderStepOne = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Шаг 1: Основная информация</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm">Имя и Фамилия</label>
          <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} className="w-full mt-1 rounded-xl border p-2 bg-white dark:bg-zinc-800" />
        </div>
        <div>
          <label className="text-sm">Страна поступления</label>
          <select value={selectedCountryId} onChange={e => setSelectedCountryId(e.target.value)} className="w-full mt-1 rounded-xl border p-2 bg-white dark:bg-zinc-800">
            {countries.map(c => <option key={c.id} value={c.id}>{c.flag_icon} {c.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Шаг 2: Выбор университетов</h3>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
        {universities.map(uni => (
          <label key={uni.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedUniversityIds.includes(uni.id)}
              onChange={() => {
                setSelectedUniversityIds(prev =>
                  prev.includes(uni.id) ? prev.filter(id => id !== uni.id) : [...prev, uni.id]
                );
              }}
            />
            <span>{uni.logo_url} {uni.name}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Шаг 3: Назначение задач</h3>
      <p className="text-xs text-zinc-400 mb-2">Отображены задачи для страны: {countries.find(c => c.id === selectedCountryId)?.name}</p>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
        {availableQuests.map(quest => (
          <label key={quest.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer">
             <input
              type="checkbox"
              checked={selectedQuestIds.includes(quest.id)}
              onChange={() => {
                setSelectedQuestIds(prev =>
                  prev.includes(quest.id) ? prev.filter(id => id !== quest.id) : [...prev, quest.id]
                );
              }}
            />
            <span className="text-sm">{quest.title}</span>
          </label>
        ))}
      </div>
      {/* --- НОВОЕ: Блок для добавления своих задач --- */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <h4 className="font-semibold text-sm mb-2">Добавить свою задачу</h4>
        <div className="flex gap-2">
            <input
                type="text"
                placeholder="Название задачи"
                className="flex-1 rounded-xl border p-2 bg-white dark:bg-zinc-800 text-sm"
                value={newCustomQuestTitle}
                onChange={e => setNewCustomQuestTitle(e.target.value)}
            />
            <button className="btn btn-primary text-sm" onClick={handleAddCustomQuest}>Добавить</button>
        </div>
        <div className="space-y-2 mt-3 max-h-24 overflow-y-auto pr-2">
            {customQuests.map(quest => (
                <div key={quest.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedQuestIds.includes(quest.id)}
                            onChange={() => {
                                setSelectedQuestIds(prev =>
                                    prev.includes(quest.id) ? prev.filter(id => id !== quest.id) : [...prev, quest.id]
                                );
                            }}
                        />
                        <span className="text-sm">{quest.title}</span>
                    </label>
                    <button onClick={() => handleRemoveCustomQuest(quest.id)} className="text-red-400 hover:text-red-500 text-xl leading-none">&times;</button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderStepFour = () => (
    <div>
      <h3 className="text-lg font-semibold mb-4">Шаг 4: Проверка и сохранение</h3>
      <div className="space-y-3 text-sm">
        <p><b>Имя:</b> {studentName}</p>
        <p><b>Страна:</b> {countries.find(c => c.id === selectedCountryId)?.name}</p>
        <div>
            <b>Университеты:</b>
            <ul className="list-disc list-inside pl-2 text-xs">
                {universities.filter(u => selectedUniversityIds.includes(u.id)).map(u => <li key={u.id}>{u.name}</li>)}
            </ul>
        </div>
        <div>
            <b>Задачи:</b>
            <ul className="list-disc list-inside pl-2 text-xs">
                {quests.filter(q => selectedQuestIds.includes(q.id)).map(q => <li key={q.id}>{q.title}</li>)}
                {customQuests.filter(q => selectedQuestIds.includes(q.id)).map(q => <li key={q.id}><i>{q.title} (своя задача)</i></li>)}
            </ul>
        </div>
      </div>
    </div>
  );


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-2xl card p-6 bg-zinc-900" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold mb-1">Новый студент</h2>
            <button onClick={onClose} className="text-2xl leading-none">&times;</button>
        </div>
        <p className="text-sm text-zinc-400 mb-6">Шаг {currentStep} из 4</p>

        <div className="min-h-[20rem]">
            {currentStep === 1 && renderStepOne()}
            {currentStep === 2 && renderStepTwo()}
            {currentStep === 3 && renderStepThree()}
            {currentStep === 4 && renderStepFour()}
        </div>

        {/* Навигация */}
        <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center">
          <div>
            {currentStep > 1 && (
              <button className="btn" onClick={handleBack}>Назад</button>
            )}
          </div>
          <div>
            {currentStep < 4 ? (
              <button className="btn btn-primary" onClick={handleNext}>Далее</button>
            ) : (
              <button className="btn btn-primary" onClick={handleSave}>Сохранить студента</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
