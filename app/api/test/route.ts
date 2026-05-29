import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allocateProviders } from "@/lib/allocation";
import { dashboardEmitter } from "@/lib/emitter";

export async function POST() {
  try {
    const services = await prisma.service.findMany();
    if (!services.length) {
      return NextResponse.json(
        { success: false, error: "No services found. Run seed first." },
        { status: 400 }
      );
    }

    const results: { leadId: string; service: string; status: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const service = services[i % services.length];
      const timestamp = Date.now() + i;
      const phone = `555${String(timestamp).slice(-7)}`;

      try {
        const lead = await prisma.lead.create({
          data: {
            name: `Test Lead ${i + 1}`,
            phone,
            email: `test${timestamp}@example.com`,
            serviceId: service.id,
          },
        });

        await allocateProviders(lead.id, service.id);
        results.push({ leadId: lead.id, service: service.name, status: "ok" });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "error";
        results.push({ leadId: "N/A", service: service.name, status: msg });
      }
    }

    dashboardEmitter.emit();

    return NextResponse.json({ success: true, data: results });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
