import { GoogleAuthCompleteClient } from "@/components/taskflow/GoogleAuthCompleteClient";

export default async function GoogleAuthCompletePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    new_user?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <GoogleAuthCompleteClient
      errorCode={params.error ?? null}
      isNewUser={params.new_user === "1"}
    />
  );
}
