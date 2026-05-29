"use client";

import { useEffect, useState, useCallback } from "react";

type Assignment = {
  id: string;
  assignedAt: string;
  lead: {
    id: string;
    name: string;
    phone: string;
    email: string;
    service: { name: string };
  };
};

type Provider = {
  id: string;
  name: string;
  monthlyQuota: number;
  leadsAssigned: number;
  remaining: number;
  assignments: Assignment[];
};

type RecentLead = {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  service: { name: string };
  assignments: { provider: { name: string } }[];
};

type DashboardData = {
  providers: Provider[];
  recentLeads: RecentLead[];
  totalLeads: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SSE real-time updates
  useEffect(() => {
    const es = new EventSource("/api/sse");
    es.onmessage = (e) => {
      if (e.data === "update") fetchData();
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-red-500 mt-10">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Total Leads: <span className="font-semibold text-slate-700">{data.totalLeads}</span>
            {lastUpdated && (
              <span className="ml-3 text-xs text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      </div>

      {/* Provider Cards */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          Provider Quota Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.providers.map((p) => {
            const pct = Math.round((p.leadsAssigned / p.monthlyQuota) * 100);
            const full = p.remaining === 0;
            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl border p-4 shadow-sm ${
                  full ? "border-red-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">
                    {p.name}
                  </span>
                  {full && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      Full
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-slate-800">
                  {p.leadsAssigned}
                  <span className="text-sm font-normal text-slate-400">
                    /{p.monthlyQuota}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      full ? "bg-red-400" : pct > 70 ? "bg-amber-400" : "bg-blue-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  {p.remaining} remaining
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Leads Table */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          Recent Leads
        </h2>
        {data.recentLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
            No leads yet. Submit one from the Request Service page.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Service
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Assigned Providers
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {lead.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{lead.phone}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {lead.service.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {lead.assignments.map((a, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full"
                          >
                            {a.provider.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(lead.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provider Assignment Details */}
      <div>
        <h2 className="text-base font-semibold text-slate-700 mb-3">
          Provider Assignment Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.providers.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-slate-700">{p.name}</span>
                <span className="text-xs text-slate-400">
                  {p.leadsAssigned} leads
                </span>
              </div>
              {p.assignments.length === 0 ? (
                <p className="text-xs text-slate-400">No assignments yet</p>
              ) : (
                <ul className="space-y-2">
                  {p.assignments.map((a) => (
                    <li
                      key={a.id}
                      className="text-xs bg-slate-50 rounded-lg p-2 border border-slate-100"
                    >
                      <div className="font-medium text-slate-700">
                        {a.lead.name}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {a.lead.service.name} · {a.lead.phone}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
