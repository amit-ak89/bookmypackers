"use client";

import { useState } from "react";

type LogEntry = {
  id: number;
  time: string;
  type: "success" | "error" | "info";
  message: string;
};

let logId = 0;

export default function TestToolsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  function addLog(type: LogEntry["type"], message: string) {
    setLogs((prev) => [
      {
        id: logId++,
        time: new Date().toLocaleTimeString(),
        type,
        message,
      },
      ...prev.slice(0, 49),
    ]);
  }

  async function resetQuota() {
    setLoading("reset");
    const eventId = `reset-${Date.now()}`;
    addLog("info", `Sending reset-quota webhook (eventId: ${eventId})`);
    try {
      const res = await fetch("/api/webhook/reset-quota", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(
          "success",
          `✅ ${data.data.message} | duplicate: ${data.data.duplicate}`
        );
      } else {
        addLog("error", `❌ ${data.error}`);
      }
    } catch {
      addLog("error", "❌ Network error");
    } finally {
      setLoading(null);
    }
  }

  async function testIdempotency() {
    setLoading("idempotency");
    const eventId = `idempotency-test-${Date.now()}`;
    addLog("info", `Testing idempotency with same eventId: ${eventId}`);

    for (let i = 1; i <= 3; i++) {
      try {
        const res = await fetch("/api/webhook/reset-quota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId }),
        });
        const data = await res.json();
        if (data.success) {
          addLog(
            data.data.duplicate ? "info" : "success",
            `Request ${i}: ${data.data.message} | duplicate: ${data.data.duplicate}`
          );
        } else {
          addLog("error", `Request ${i}: ❌ ${data.error}`);
        }
      } catch {
        addLog("error", `Request ${i}: ❌ Network error`);
      }
    }
    setLoading(null);
  }

  async function generateLeads() {
    setLoading("generate");
    addLog("info", "Generating 10 test leads...");
    try {
      const res = await fetch("/api/test", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const ok = data.data.filter((r: { status: string }) => r.status === "ok").length;
        const fail = data.data.length - ok;
        addLog("success", `✅ Generated ${ok} leads successfully, ${fail} failed`);
        data.data.forEach(
          (r: { service: string; leadId: string; status: string }, i: number) => {
            addLog(
              r.status === "ok" ? "success" : "error",
              `Lead ${i + 1}: ${r.service} → ${r.status}`
            );
          }
        );
      } else {
        addLog("error", `❌ ${data.error}`);
      }
    } catch {
      addLog("error", "❌ Network error");
    } finally {
      setLoading(null);
    }
  }

  async function concurrencyTest() {
    setLoading("concurrency");
    addLog("info", "Sending 5 concurrent lead requests...");
    try {
      const results = await Promise.allSettled(
        Array.from({ length: 5 }, (_, i) =>
          fetch("/api/test", { method: "POST" }).then((r) => r.json())
        )
      );
      results.forEach((r, i) => {
        if (r.status === "fulfilled" && r.value.success) {
          const ok = r.value.data.filter((x: { status: string }) => x.status === "ok").length;
          addLog("success", `Batch ${i + 1}: ${ok}/10 leads created`);
        } else {
          addLog("error", `Batch ${i + 1}: failed`);
        }
      });
    } catch {
      addLog("error", "❌ Network error");
    } finally {
      setLoading(null);
    }
  }

  const buttons = [
    {
      id: "reset",
      label: "Reset Quota (Webhook)",
      description: "Calls POST /api/webhook/reset-quota with a new eventId",
      color: "bg-amber-500 hover:bg-amber-600",
      action: resetQuota,
    },
    {
      id: "idempotency",
      label: "Test Webhook Idempotency",
      description: "Sends same eventId 3 times — only first should process",
      color: "bg-purple-500 hover:bg-purple-600",
      action: testIdempotency,
    },
    {
      id: "generate",
      label: "Generate 10 Leads",
      description: "Creates 10 test leads across all services instantly",
      color: "bg-blue-500 hover:bg-blue-600",
      action: generateLeads,
    },
    {
      id: "concurrency",
      label: "Concurrency Test",
      description: "Fires 5 concurrent batches of 10 leads to test race conditions",
      color: "bg-red-500 hover:bg-red-600",
      action: concurrencyTest,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Test Tools</h1>
        <p className="text-slate-500 text-sm mt-1">
          Use these tools to test allocation, webhooks, and concurrency.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {buttons.map((btn) => (
          <div
            key={btn.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
          >
            <p className="text-xs text-slate-400 mb-3">{btn.description}</p>
            <button
              onClick={btn.action}
              disabled={loading !== null}
              className={`w-full ${btn.color} disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors`}
            >
              {loading === btn.id ? "Running..." : btn.label}
            </button>
          </div>
        ))}
      </div>

      {/* Log Output */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-sm font-semibold text-slate-700">
            Activity Log
          </span>
          <button
            onClick={() => setLogs([])}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        </div>
        <div className="h-72 overflow-y-auto p-4 font-mono text-xs space-y-1.5 bg-slate-50">
          {logs.length === 0 ? (
            <p className="text-slate-400">
              No activity yet. Click a button above.
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={`flex gap-2 ${
                  log.type === "success"
                    ? "text-green-700"
                    : log.type === "error"
                    ? "text-red-600"
                    : "text-slate-500"
                }`}
              >
                <span className="text-slate-400 shrink-0">{log.time}</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
