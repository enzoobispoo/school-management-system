import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

interface ActivateInvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function AtivarContaPage({
  params,
}: ActivateInvitePageProps) {
  const { token } = await params;

  return <AcceptInviteForm token={token} />;
}