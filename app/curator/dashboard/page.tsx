"use client";
import Link from "next/link";
import allStudents from "@/mock/students.json";
import allProgress from "@/mock/student_progress.json";
import allQuests from "@/mock/quest_templates.json";
import allCountries from "@/mock/countries.json";
import { useMemo } from "react";

type StudentProgress = { [key: number]: { status: string } };

export default function CuratorDashboard() {

  const studentData = useMemo(() => {
    return allStudents.map(student => {
      const country = allCountries.find(c => c.id === student.country_id);
      if (!country) return { ...student, totalQuests: 0, completedQuests: 0, progressPercentage: 0, alerts: [], flag: '', countryName: '' };

      const requiredQuests = new Set(country.required_quest_ids);
      const studentProgress: StudentProgress = (allProgress as any)[student.id] || {};

      const completedQuests = Object.keys(studentProgress)
        .map(Number)
        .filter(questId => requiredQuests.has(questId) && studentProgress[questId].status === 'done');

      const onReviewQuests = Object.keys(studentProgress)
        .map(Number)
        .filter(questId => requiredQuests.has(questId) && studentProgress[questId].status === 'review');

      const progressPercentage = requiredQuests.size > 0 ? (completedQuests.length / requiredQuests.size) * 100 : 0;

      // Формируем "красные флаги"
      const alerts = [];
      if (onReviewQuests.length > 0) {
        alerts.push({ type: 'review', text: `На проверке: ${onReviewQuests.length} квеста` });
      }
      if (progressPercentage < 30) {
        alerts.push({ type: 'warning', text: 'Низкий прогресс' });
      }

      return {
        ...student,
        countryName: country.name,
        flag: country.flag_icon,
        totalQuests: requiredQuests.size,
        completedQuests: completedQuests.length,
        progressPercentage,
        alerts
      };
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Панель Студентов</h1>
      <p className="text-zinc-600 dark:text-zinc-300 mb-6">Обзор прогресса всех активных студентов.</p>

      <div className="space-y-4">
        {studentData.map(student => (
          <Link key={student.id} href={`/curator/student/${student.id}`} className="card block p-4 hover:bg-black/5 dark:hover:bg-white/5 transition">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{student.name}</div>
                <div className="text-sm text-zinc-500">{student.flag} {student.countryName}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-medium text-sm">Прогресс</div>
                  <div className="text-xs text-zinc-500">{student.completedQuests} / {student.totalQuests} квестов</div>
                </div>
                <div className="w-24">
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${student.progressPercentage}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            {student.alerts.length > 0 && (
              <div className="mt-3 flex items-center gap-2 border-t pt-2">
                {student.alerts.map((alert, index) => (
                  <span key={index} className={`text-xs px-2 py-1 rounded-full ${alert.type === 'review' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-red-500/10 text-red-700'}`}>
                    {alert.text}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
