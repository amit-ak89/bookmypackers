import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dashboardEmitter } from "@/lib/emitter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId is required" },
        { status: 400 }
      );
    }

    // Idempotency check
    const existing = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: { message: "Already processed", eventId, duplicate: true },
      });
    }

    // Process: reset all provider quotas
    await prisma.$transaction([
      prisma.provider.updateMany({
        data: { leadsAssigned: 0 },
      }),
      prisma.webhookEvent.create({
        data: { eventId, eventType: "reset-quota" },
      }),
    ]);

    dashboardEmitter.emit();

    return NextResponse.json({
      success: true,
      data: { message: "Quota reset successfully", eventId, duplicate: false },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
