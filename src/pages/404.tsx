import Link from "next/link";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-700 mb-2">Page not found</h1>
        <p className="text-sm text-gray-400 mb-8">
          The page you are looking for does not exist or was moved.
        </p>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </MainLayout>
  );
}
