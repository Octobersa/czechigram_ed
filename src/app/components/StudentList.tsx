"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StudentListProps {
    initialStudents: string[];
    canShowDelete: boolean;
}

export default function StudentList({ initialStudents, canShowDelete }: StudentListProps) {
    const [students, setStudents] = useState(initialStudents);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setStudents(initialStudents);
    }, [initialStudents]);

    const handleDelete = async (studentName: string) => {
        if (confirm(`Are you sure you want to delete student schema for ${studentName}?`)) {
            setIsDeleting(studentName);
            setError(null);

            try {
                const response = await fetch(`/students/api?studentName=${studentName}`, {
                    method: "DELETE",
                    headers: {
                        "X-Auth-Token": localStorage.getItem("adminToken") || "",
                    },
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || "Failed to delete student schema");
                }

                setStudents(students.filter(s => s !== studentName));
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Something went wrong. Please try again.");
                }
            } finally {
                setIsDeleting(null);
            }
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded" data-test-id="students-list-error">
                    {error}
                </div>
            )}

            {students.length === 0 ? (
                <p className="text-black" data-test-id="students-list-empty">No students found.</p>
            ) : (
                <ul className="divide-y">
                    {students.map((student) => (
                        <li key={student} className="py-3 flex justify-between items-center" data-test-id={`student-row-${student}`}>
                            <span className="text-lg text-black">{student}</span>
                            <div className="flex items-center space-x-2">
                                <Link
                                    href={`/${student}`}
                                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
                                    data-test-id={`view-${student}`}
                                >
                                    View app
                                </Link>
                                {canShowDelete && (
                                    <button
                                        onClick={() => handleDelete(student)}
                                        disabled={isDeleting === student}
                                        className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded disabled:opacity-50"
                                        data-test-id={`delete-${student}`}
                                    >
                                        {isDeleting === student ? "Deleting..." : "Delete"}
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
