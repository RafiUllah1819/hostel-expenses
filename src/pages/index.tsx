import Link from "next/link";
import Button from "@/components/ui/Button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold text-blue-700 mb-4">SplitEase</h1>
        <p className="text-lg text-gray-600 mb-8">
          Effortlessly track shared expenses with your hostel friends. Split
          bills, settle debts, and keep everyone on the same page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
          <Link href="/expenses/add">
            <Button size="lg" variant="secondary">
              Add an Expense
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
