"use client";
import { useState, useEffect } from "react";
import StudentList from "@/app/components/StudentList";
import AddStudentForm from "@/app/components/AddStudentForm";

export default function StudentManagementPage() {
    const [students, setStudents] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error] = useState(null);
    const [canShowAdminFeatures, setCanShowAdminFeatures] = useState(false);


    useEffect(() => {

        const adminToken = localStorage.getItem("adminToken");
        if (adminToken) {
            setCanShowAdminFeatures(true);
        }

        const fetchStudents = async () => {
            try {
                const response = await fetch("/students/api");
                const data = await response.json();
                setStudents(data || []);
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const handleStudentAdded = (newStudentName: string) => {
        setStudents(prevStudents => [...prevStudents, newStudentName]);
    };

    return (

        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8" data-test-id="students-management-title">Student Management</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {canShowAdminFeatures && (<div>
                    <h2 className="text-xl font-semibold mb-4">Add New Student</h2>
                    <AddStudentForm onStudentAdded={handleStudentAdded} />
                </div>)}

                <div>
                    <h2 className="text-xl font-semibold mb-4">Existing Students</h2>
                    {isLoading ? (
                        <p data-test-id="students-loading">Loading students...</p>
                    ) : error ? (
                        <p className="text-red-500" data-test-id="students-error">{error}</p>
                    ) : (
                        <StudentList initialStudents={students} canShowDelete={canShowAdminFeatures} />
                    )}
                </div>
            </div>
        </div>
    );
}
