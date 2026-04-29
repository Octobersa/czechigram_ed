"use client";
import { getBugsWithStatuses, setBugStatus} from "@/app/lib/bugActions";
import { useParams } from "next/navigation";
import React from "react";

export default function BugsPage() {
    const params = useParams();
    const student = params.student as string;

    return <BugsPageContent student={student} />;
}

function BugsPageContent({ student }: { student: string }) {
    const [bugsWithStatus, setBugsWithStatus] = React.useState<Array<{
        id: string;
        description: string;
        isFixed: boolean;
    }>>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            const bugs = await getBugsWithStatuses(student);
            setBugsWithStatus(bugs);
        };

        fetchData();
    }, [student]);

    const updateBugStatus = (bugId: string, isFixed: boolean) => {
        setBugsWithStatus(prevBugs =>
            prevBugs.map(bug =>
                bug.id === bugId ? { ...bug, isFixed } : bug
            )
        );
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Bug Management</h1>
            <div className="space-y-4">
                {bugsWithStatus.map(bug => (
                    <BugItem
                        key={bug.id}
                        bug={bug}
                        student={student}
                        onStatusChange={updateBugStatus}
                    />
                ))}
            </div>
        </div>
    );
}

function BugItem({
                     bug,
                     student,
                     onStatusChange
                 }: {
    bug: { id: string; description: string; isFixed: boolean },
    student: string,
    onStatusChange: (bugId: string, isFixed: boolean) => void
}) {
    const toggleBug = async () => {
        try {
            await setBugStatus(bug.id, !bug.isFixed, student);
            onStatusChange(bug.id, !bug.isFixed);
        } catch (error) {
            console.error('Failed to update bug status:', error);
        }
    };

    return (
        <div className="border p-4 rounded flex justify-between items-center">
            <div>
                <h3 className="font-semibold">{bug.id}</h3>
                <p>{bug.description}</p>
            </div>
            <button
                onClick={toggleBug}
                className={`px-4 py-2 rounded ${bug.isFixed ? 'bg-green-500' : 'bg-red-500'} text-white`}
            >
                {bug.isFixed ? 'Fixed' : 'Not Fixed'}
            </button>
        </div>
    );
}