export type ServiceWithRelations = {
  id: string;
  name: string;
  providers: ProviderBasic[];
  poolProviders: ProviderBasic[];
};

export type ProviderBasic = {
  id: string;
  name: string;
  monthlyQuota: number;
  leadsAssigned: number;
};

export type ProviderDashboard = ProviderBasic & {
  remaining: number;
  assignments: {
    id: string;
    assignedAt: string;
    lead: {
      id: string;
      name: string;
      phone: string;
      email: string;
      service: { name: string };
    };
  }[];
};

export type LeadFormData = {
  name: string;
  phone: string;
  email: string;
  serviceId: string;
};

export type LeadWithAssignments = {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  service: { name: string };
  assignments: {
    provider: { name: string };
  }[];
};

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
