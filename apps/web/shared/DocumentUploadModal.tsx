"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Check, FileText, AlertCircle, Upload, ChevronRight, GraduationCap, User, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
// DOCUMENT_GUIDELINES import removed as we use backend data now
import { DocumentType } from './documentData'; // Keep type if needed, or remove if fully dynamic

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface DocumentRequirement {
    id: number; // Template ID
    title: string;
    step_order: number;
    document_type: string;
    advice_text: string;
    validation_rules: string[];
    rejection_reasons: string[];
    studentDocument: {
        id: string;
        status: 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED';
        minio_file_path?: string;
        manager_comment?: string;
    } | null;
    status: 'MISSING' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentUploadModal({ isOpen, onClose }: DocumentUploadModalProps) {
    const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch requirements
    const fetchRequirements = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/documents/requirements', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}` // Assuming logic
                }
            });
            if (res.ok) {
                const data = await res.json();
                setRequirements(data);
            }
        } catch (error) {
            console.error("Failed to fetch requirements", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchRequirements();
        }
    }, [isOpen]);

    const activeRequirement = requirements[currentStepIndex];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeRequirement) {
            await handleUpload(e.target.files[0], activeRequirement.id);
        }
    };

    const handleUpload = async (file: File, templateId: number) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('template_id', templateId.toString());

            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: formData
            });

            if (res.ok) {
                // Refetch to update status
                await fetchRequirements();
            } else {
                console.error("Upload failed");
            }
        } catch (error) {
            console.error("Upload error", error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'passport': return User;
            case 'education': return GraduationCap;
            case 'translation': return ShieldCheck;
            default: return FileText;
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-0 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-xl md:w-full overflow-hidden">

                    <div className="flex flex-col md:flex-row h-[600px]">
                        {/* Left Side: Navigation & Form */}
                        <div className="flex-1 flex flex-col p-6 md:p-8 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-8">
                                <Dialog.Title className="text-xl font-semibold tracking-tight">
                                    Загрузка документов
                                </Dialog.Title>
                                <Dialog.Close className="rounded-full p-2 hover:bg-gray-100 transition-colors">
                                    <X className="h-4 w-4" />
                                </Dialog.Close>
                            </div>

                            {isLoading ? (
                                <div className="flex-1 flex items-center justify-center">Loading...</div>
                            ) : (
                                <>
                                    {/* Stepper */}
                                    <div className="mb-8 overflow-x-auto">
                                        <nav aria-label="Progress">
                                            <ol role="list" className="flex items-center min-w-max">
                                                {requirements.map((req, index) => {
                                                    const isActive = index === currentStepIndex;
                                                    const isCompleted = req.status === 'APPROVED' || req.status === 'PENDING';
                                                    const Icon = getIconForType(req.document_type);

                                                    return (
                                                        <li key={req.id} className={cn("relative", index !== requirements.length - 1 ? "pr-8 sm:pr-20" : "")}>
                                                            {index !== requirements.length - 1 && (
                                                                <div className="absolute top-4 left-0 -right-8 sm:-right-20 h-0.5 bg-gray-200" aria-hidden="true">
                                                                    <div className={cn("h-full bg-blue-600 transition-all duration-300", index < currentStepIndex ? "w-full" : "w-0")} />
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() => setCurrentStepIndex(index)}
                                                                className="group relative flex flex-col items-center group"
                                                            >
                                                                <span className={cn(
                                                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors z-10 bg-white",
                                                                    isActive ? "border-blue-600 bg-white" : isCompleted ? "border-blue-600 bg-blue-600" : "border-gray-300"
                                                                )}>
                                                                    {isCompleted ? (
                                                                        <Check className="h-5 w-5 text-white" />
                                                                    ) : (
                                                                        <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-gray-500")} />
                                                                    )}
                                                                </span>
                                                                <span className={cn(
                                                                    "mt-2 text-xs font-medium transition-colors absolute top-8 whitespace-nowrap",
                                                                    isActive ? "text-blue-600" : "text-gray-500"
                                                                )}>
                                                                    {req.title}
                                                                </span>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                        </nav>
                                    </div>

                                    {/* Upload Area */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-white p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group",
                                            uploading && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />

                                        {activeRequirement?.status === 'PENDING' ? (
                                            <div className="text-center">
                                                <div className="h-16 w-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                                                    <Check className="h-8 w-8 text-yellow-600" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">Файл отправлен</h3>
                                                <p className="text-sm text-gray-500 mb-4">Ожидает проверки менеджером</p>
                                                <p className="text-xs text-blue-600 underline">Загрузить другую версию?</p>
                                            </div>
                                        ) : activeRequirement?.status === 'APPROVED' ? (
                                            <div className="text-center">
                                                <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                                                    <Check className="h-8 w-8 text-green-600" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">Документ принят</h3>
                                                <p className="text-sm text-gray-500">Все отлично!</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div> : <Upload className="h-8 w-8 text-blue-600" />}
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                    {uploading ? "Загрузка..." : "Перетащите файл сюда"}
                                                </h3>
                                                <p className="text-sm text-gray-500 text-center max-w-xs mb-4">
                                                    Поддерживаются PDF, JPG, PNG (макс. 10Мб)
                                                </p>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm hover:shadow dark:bg-blue-600 dark:hover:bg-blue-700">
                                                    Выбрать файл
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-6 flex justify-between">
                                        <button
                                            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                                            disabled={currentStepIndex === 0}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 text-sm font-medium"
                                        >
                                            Назад
                                        </button>
                                        <button
                                            onClick={() => setCurrentStepIndex(Math.min(requirements.length - 1, currentStepIndex + 1))}
                                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2"
                                        >
                                            {currentStepIndex === requirements.length - 1 ? 'Завершить' : 'Далее'}
                                            {currentStepIndex !== requirements.length - 1 && <ChevronRight className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Right Side: Contextual Advice */}
                        <div className="w-full md:w-[350px] border-l bg-white p-6 md:p-8 flex flex-col overflow-y-auto">
                            {activeRequirement && (
                                <ContextualAdvice
                                    requirement={activeRequirement}
                                />
                            )}
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// ----------------------------------------------------------------------
// Subcomponent: Contextual Advice
// ----------------------------------------------------------------------

interface ContextualAdviceProps {
    requirement: DocumentRequirement;
}

function ContextualAdvice({ requirement }: ContextualAdviceProps) {
    const isRejected = requirement.status === 'REJECTED';
    const rejectedReason = requirement.studentDocument?.manager_comment;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

            {/* Error Block - Shows only if rejected */}
            {isRejected && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-red-900">Документ отклонен</h4>
                            <p className="text-sm text-red-700 mt-1">{rejectedReason || "Менеджер не указал причину."}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h2 className={cn("text-lg font-bold flex items-center gap-2", isRejected ? "text-red-600" : "text-gray-900")}>
                    <FileText className="h-5 w-5" />
                    {requirement.title}
                </h2>
                {isRejected && <p className="text-xs text-red-500 font-medium mt-1">Требуется исправление</p>}
            </div>

            {/* Hint/Instruction */}
            {requirement.advice_text && (
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                    <h5 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Инструкция</h5>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {requirement.advice_text}
                    </p>
                </div>
            )}

            {/* Validation Checklist */}
            {requirement.validation_rules && requirement.validation_rules.length > 0 && (
                <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Важно проверить</h5>
                    <ul className="space-y-3">
                        {requirement.validation_rules.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-600">
                                <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center shrink-0 mt-0.5 bg-gray-50">
                                    <span className="text-[10px] text-gray-400 font-mono">{i + 1}</span>
                                </div>
                                <span className="leading-snug">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

