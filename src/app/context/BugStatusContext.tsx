"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { getBugsWithStatuses } from '@/app/lib/bugActions';
import { BugId } from '@/app/lib/bugs';

type BugStatusesMap = Partial<Record<BugId, boolean>>;

interface BugStatusContextType {
    bugStatuses: BugStatusesMap;
    isLoading: boolean;
    getBugStatus: (bugId: BugId) => boolean | undefined;
}

const BugStatusContext = createContext<BugStatusContextType | undefined>(undefined);

export const BugStatusProvider = ({ children }: { children: ReactNode }) => {
    const [bugStatuses, setBugStatuses] = useState<BugStatusesMap>({});
    const [isLoading, setIsLoading] = useState(true);
    const params = useParams();
    const student = params.student as string;

    useEffect(() => {
        if (student) {
            const fetchStatuses = async () => {
                setIsLoading(true);
                try {
                    const statusesFromServer = await getBugsWithStatuses(student);
                    const statusesMap: BugStatusesMap = {};
                    statusesFromServer.forEach(bug => {
                        statusesMap[bug.id as BugId] = bug.isFixed;
                    });
                    setBugStatuses(statusesMap);
                } catch  {
                    console.error("Failed to load bug configurations.");
                    setBugStatuses({});
                } finally {
                    setIsLoading(false);
                }
            };
            fetchStatuses();
        } else {
            setBugStatuses({});
            setIsLoading(false);
        }
    }, [student]);

    const getBugStatus = (bugId: BugId): boolean | undefined => {
        if (isLoading) return undefined;
        return bugStatuses[bugId];
    };

    return (
        <BugStatusContext.Provider value={{ bugStatuses, isLoading, getBugStatus }}>
            {children}
        </BugStatusContext.Provider>
    );
};

export const useBugStatus = (): BugStatusContextType => {
    const context = useContext(BugStatusContext);
    if (context === undefined) {
        throw new Error('useBugStatus must be used within a BugStatusProvider');
    }
    return context;
};