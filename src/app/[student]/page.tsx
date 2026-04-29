import { redirect } from "next/navigation";

export default async function StudentRootPage({
  params,
}: {
  params: Promise<{ student: string }>;
}) {
  const { student } = await params;
  redirect(`/${student}/login`);
}
