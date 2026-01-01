export declare enum DocumentType {
    PASSPORT = "passport",
    EDUCATION = "education",
    TRANSLATION = "translation",
    OTHER = "other"
}
export declare class DocumentTemplate {
    id: number;
    title: string;
    step_order: number;
    document_type: DocumentType;
    advice_text?: string;
    rejection_reasons?: string[];
    validation_rules?: string[];
    created_at: Date;
    updated_at: Date;
}
