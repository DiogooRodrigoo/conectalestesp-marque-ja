import { redirect } from "next/navigation";

export default async function PainelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/${slug}/painel/overview`);
}
