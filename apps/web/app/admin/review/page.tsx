"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/shared/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type StudentDocument = {
    id: string;
    status: string;
    minio_file_path: string;
    created_at: string;
    template: { name: string };
    student: { fullName: string; email: string };
};

export default function DocumentReviewPage() {
    const { user } = useAuth();
    const [documents, setDocuments] = useState<StudentDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<StudentDocument | null>(null);
    const [rejectionComment, setRejectionComment] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/documents/pending`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleReview = async (status: "APPROVED" | "REJECTED") => {
        if (!selectedDoc) return;
        if (status === "REJECTED" && !rejectionComment.trim()) {
            alert("Please provide a comment for rejection");
            return;
        }

        setProcessing(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_URL}/documents/${selectedDoc.id}/review`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status, comment: rejectionComment })
            });

            if (res.ok) {
                setSelectedDoc(null);
                setRejectionComment("");
                fetchDocuments();
            } else {
                alert("Error updating document status");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating document status");
        } finally {
            setProcessing(false);
        }
    };

    const isImage = (path: string) => /\.(jpg|jpeg|png)$/i.test(path);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Document Review</h1>

            {loading ? (
                <div>Loading...</div>
            ) : documents.length === 0 ? (
                <div className="text-gray-500">No pending documents found.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <thead>
                            <tr className="bg-zinc-100 dark:bg-zinc-800 text-left">
                                <th className="p-4 border-b dark:border-zinc-700">Student</th>
                                <th className="p-4 border-b dark:border-zinc-700">Document Type</th>
                                <th className="p-4 border-b dark:border-zinc-700">Date</th>
                                <th className="p-4 border-b dark:border-zinc-700">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                    <td className="p-4 border-b dark:border-zinc-700">
                                        <div>{doc.student?.fullName || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500">{doc.student?.email}</div>
                                    </td>
                                    <td className="p-4 border-b dark:border-zinc-700">{doc.template?.name || 'Document'}</td>
                                    <td className="p-4 border-b dark:border-zinc-700">{new Date(doc.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 border-b dark:border-zinc-700">
                                        <button
                                            onClick={() => setSelectedDoc(doc)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedDoc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
                        {/* Left: Document Viewer */}
                        <div className="w-2/3 bg-zinc-100 dark:bg-zinc-800 p-4 flex items-center justify-center border-r dark:border-zinc-700">
                            {isImage(selectedDoc.minio_file_path) ? (
                                <img
                                    src={selectedDoc.minio_file_path}
                                    alt="Document"
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <iframe
                                    src={selectedDoc.minio_file_path}
                                    className="w-full h-full border-none"
                                    title="Document Preview"
                                />
                            )}
                        </div>

                        {/* Right: Controls */}
                        <div className="w-1/3 p-6 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedDoc.template?.name}</h2>
                                    <p className="text-gray-500">{selectedDoc.student?.fullName}</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedDoc(null); setRejectionComment(""); }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1">
                                <h3 className="font-semibold mb-2">Rejection Reason</h3>
                                <textarea
                                    className="w-full h-32 p-3 border rounded dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Enter reason for rejection..."
                                    value={rejectionComment}
                                    onChange={(e) => setRejectionComment(e.target.value)}
                                />
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => handleReview("APPROVED")}
                                    disabled={processing}
                                    className="flex-1 bg-green-600 text-white py-3 rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => handleReview("REJECTED")}
                                    disabled={processing}
                                    className="flex-1 bg-red-600 text-white py-3 rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
