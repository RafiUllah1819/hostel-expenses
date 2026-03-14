import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Button from "@/components/ui/Button";
import SummaryCards from "@/components/balances/SummaryCards";
import BalanceTable from "@/components/balances/BalanceTable";
import { fetchMemberBalances } from "@/services/balanceService";
import type { MemberBalance } from "@/types";

export default function BalancesPage() {
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMemberBalances();
      setBalances(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load balances.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balances</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Who owes what based on all recorded expenses
          </p>
        </div>
        {!loading && (
          <Button variant="secondary" size="sm" onClick={load}>
            Refresh
          </Button>
        )}
      </div>

      {/* ── Loading skeleton ──────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          {/* Skeleton summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2"
              >
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-7 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Skeleton table rows */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3">
              <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center gap-4 px-4 py-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <Button variant="secondary" size="sm" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Data ──────────────────────────────────────────────────────── */}
      {!loading && !error && (
        <>
          {balances.length > 0 && <SummaryCards balances={balances} />}
          <BalanceTable balances={balances} />
        </>
      )}
    </MainLayout>
  );
}
