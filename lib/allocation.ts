import { prisma } from "./prisma";

/**
 * Allocates exactly 3 providers to a lead:
 * - All mandatory providers for the service
 * - Remaining slots filled from pool using persistent round-robin
 * - Respects monthly quota
 * - Concurrency-safe via Prisma transaction
 */
export async function allocateProviders(
  leadId: string,
  serviceId: string
): Promise<string[]> {
  return await prisma.$transaction(async (tx) => {
    // Load service with mandatory + pool providers
    const service = await tx.service.findUniqueOrThrow({
      where: { id: serviceId },
      include: {
        providers: true,      // mandatory
        poolProviders: true,  // round-robin pool
      },
    });

    const mandatory = service.providers;
    const pool = service.poolProviders;
    const needed = 3 - mandatory.length;

    // Validate mandatory providers have quota
    for (const p of mandatory) {
      if (p.leadsAssigned >= p.monthlyQuota) {
        throw new Error(
          `Mandatory provider "${p.name}" has reached monthly quota`
        );
      }
    }

    // Get or create allocation state (with row lock via update)
    let state = await tx.allocationState.findUnique({
      where: { serviceId },
    });
    if (!state) {
      state = await tx.allocationState.create({
        data: { serviceId, currentIndex: 0 },
      });
    }

    // Pick `needed` providers from pool using round-robin
    const selected: string[] = [];
    let index = state.currentIndex;
    let attempts = 0;

    while (selected.length < needed && attempts < pool.length * 2) {
      const candidate = pool[index % pool.length];
      index++;
      attempts++;

      // Skip if already mandatory
      if (mandatory.some((m) => m.id === candidate.id)) continue;
      // Skip if already selected
      if (selected.includes(candidate.id)) continue;
      // Skip if quota exhausted
      if (candidate.leadsAssigned >= candidate.monthlyQuota) continue;

      selected.push(candidate.id);
    }

    if (selected.length < needed) {
      throw new Error(
        `Not enough providers with remaining quota for ${service.name}`
      );
    }

    // Persist new round-robin index
    await tx.allocationState.update({
      where: { serviceId },
      data: { currentIndex: index },
    });

    const allProviderIds = [
      ...mandatory.map((m) => m.id),
      ...selected,
    ];

    // Create assignments
    await tx.leadAssignment.createMany({
      data: allProviderIds.map((providerId) => ({ leadId, providerId })),
      skipDuplicates: true,
    });

    // Increment leadsAssigned for all assigned providers
    await tx.provider.updateMany({
      where: { id: { in: allProviderIds } },
      data: { leadsAssigned: { increment: 1 } },
    });

    return allProviderIds;
  });
}
