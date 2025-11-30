"use client";
import { Program, useCountry } from "@/shared/CountryContext";

type Props = {
  program: Program;
  onClose: () => void;
};

export default function ProgramDetailModal({ program, onClose }: Props) {
  const { documents } = useCountry();
  const requiredDocs = documents.filter((d) => program.required_document_ids.includes(d.id));

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="w-full max-w-3xl card p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={program.image_url} alt={program.title} className="w-full h-48 object-cover" />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">{program.title}</h2>
              <p className="text-sm text-zinc-500 mb-4">Дедлайн подачи: <b>{program.deadline}</b></p>
            </div>
            <button onClick={onClose} className="text-2xl leading-none">&times;</button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Требуемые документы:</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {requiredDocs.map(doc => <li key={doc.id}>{doc.title}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Полезная ссылка:</h3>
              <a
                href={program.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline break-words"
              >
                Официальная страница программы
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
