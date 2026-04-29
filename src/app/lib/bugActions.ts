"use server";
import {getPrismaForStudent} from "@/app/lib/prisma";
import {BugId, getAllBugs} from "@/app/lib/bugs";

export async function getBugStatus(bugId: BugId, student: string): Promise<boolean> {
    const studentDbSchema = (student.startsWith("student_")) ? student : `student_${student}`;
    const prisma = await getPrismaForStudent(studentDbSchema)
    const bug = await prisma.bugConfig.findUnique({
        where: { bugId }
    });
    return bug?.isFixed === true
}

export async function setBugStatus(bugId: string, isFixed: boolean, student: string) {
    const studentDbSchema = `student_${student}`
    const prisma = await getPrismaForStudent(studentDbSchema)
    console.log('setting bug status', bugId, isFixed)
    console.log(' for db schema', studentDbSchema)
    const res = await prisma.bugConfig.upsert({
        where: { bugId },
        update: { isFixed },
        create: { bugId, isFixed }
    })
    console.log(res)
}

export async function getBugsWithStatuses(student: string) {
    const studentDbSchema = `student_${student}`;
    const prisma = await getPrismaForStudent(studentDbSchema);
    const statuses = await prisma.bugConfig.findMany();
    const bugs = getAllBugs();

    return bugs.map(bug => ({
        ...bug,
        isFixed: statuses.find(s => s.bugId === bug.id)?.isFixed || false
    }));
}