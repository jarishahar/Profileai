import ResetPassword from "@/components/auth/reset-password";

// export default async function Page({
//   searchParams,
// }: {
//   searchParams: { token?: string };
// }) {
//   const token =
//     typeof searchParams?.token === "string" ? searchParams.token : "";

//   return <ResetPassword token={token} />;
// }

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params?.token === "string" ? params.token : "";

  return <ResetPassword token={token} />;
}
