import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allocateProviders } from "@/lib/allocation";
import { dashboardEmitter } from "@/lib/emitter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, serviceId } = body;

    if (!name || !phone || !email || !serviceId) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Create lead (@@unique on phone+serviceId handles duplicates)
    let lead;
    try {
      lead = await prisma.lead.create({
        data: { name, phone, email, serviceId },
      });
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code: string }).code === "P2002"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "This phone number already has a lead for this service",
          },
          { status: 409 }
        );
      }
      throw e;
    }

    // Allocate providers
    await allocateProviders(lead.id, serviceId);

    // Notify SSE clients
    dashboardEmitter.emit();

    return NextResponse.json({ success: true, data: { leadId: lead.id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
