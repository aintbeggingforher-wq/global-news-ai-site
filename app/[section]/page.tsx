import { notFound } from "next/navigation";
import { getSectionBySlug } from "@/lib/categories";
import { SectionTemplate } from "@/components/SectionTemplate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SectionPage({ params }: { params: { section: string } }) {
  if (!getSectionBySlug(params.section)) notFound();
  return <SectionTemplate slug={params.section} />;
}
