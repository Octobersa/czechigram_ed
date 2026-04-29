"use client";

import { useState } from "react";

interface AddStudentFormProps {
    onStudentAdded: (studentName: string) => void;
}

export default function AddStudentForm({ onStudentAdded }: AddStudentFormProps) {
    const [studentName, setStudentName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!studentName.trim()) {
            setError("Student name is required");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/students/api", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Auth-Token": localStorage.getItem("adminToken") || "",
                },
                body: JSON.stringify({ studentName }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create student schema");
            }

            setSuccess(data.message);
            onStudentAdded(studentName);
            setStudentName("");

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg p-4">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded" data-test-id="add-student-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded" data-test-id="add-student-success">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="studentName" className="block text-sm text-black font-medium mb-1">
                        Student Name
                    </label>
                    <input
                        type="text"
                        id="studentName"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full border rounded p-2 text-black"
                        placeholder="Enter student name"
                        disabled={isLoading}
                        data-test-id="student-name-input"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
                    data-test-id="create-student-button"
                >
                    {isLoading ? "Creating..." : "Create Student Schema"}
                </button>
            </form>
        </div>
    );
}
