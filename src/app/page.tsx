import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Admin",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Sign in"
      subtitle="Enter your admin email and password to continue."
    >
      <LoginForm />
    </AuthLayout>
  );
}
