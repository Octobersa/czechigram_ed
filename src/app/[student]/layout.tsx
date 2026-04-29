import { notFound } from 'next/navigation';
import { getPrismaForStudent } from '@/app/lib/prisma';

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ student: string }>;
}) {
  const { student } = await params;
  const studentSchema = `student_${student}`;

  // Validate that the student schema exists
  try {
    await getPrismaForStudent(studentSchema);
  } catch  {
    // Student schema doesn't exist, show 404
    notFound();
  }

  return <>{children}</>;
}
