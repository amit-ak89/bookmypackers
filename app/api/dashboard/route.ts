import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [providers, leads, totalLeads] = await Promise.all([
    prisma.provider.findMany({
      orderBy: { name: "asc" },
      include: {
        assignments: {
          orderBy: { assignedAt: "desc" },
          take: 5,
          include: {
            lead: {
              include: { service: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        service: { select: { name: true } },
        assignments: { include: { provider: { select: { name: true } } } },
      },
    }),
    prisma.lead.count(),
  ]);

  const providersWithRemaining = providers.map((p) => ({
    ...p,
    remaining: Math.max(0, p.monthlyQuota - p.leadsAssigned),
    assignments: p.assignments.map((a) => ({
      ...a,
      assignedAt: a.assignedAt.toISOString(),
      lead: {
        ...a.lead,
        createdAt: a.lead.createdAt.toISOString(),
      },
    })),
    createdAt: p.createdAt.toISOString(),
  }));

  return NextResponse.json({
    success: true,
    data: {
      providers: providersWithRemaining,
      recentLeads: leads.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      totalLeads,
    },
  });
}
