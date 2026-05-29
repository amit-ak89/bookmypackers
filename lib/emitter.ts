// Simple in-process event emitter for SSE connections
// In production with multiple instances, replace with Redis pub/sub

type Listener = () => void;

class DashboardEmitter {
  private listeners: Set<Listener> = new Set();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    this.listeners.forEach((fn) => fn());
  }
}

const globalForEmitter = globalThis as unknown as {
  dashboardEmitter: DashboardEmitter;
};

export const dashboardEmitter =
  globalForEmitter.dashboardEmitter ?? new DashboardEmitter();

if (process.env.NODE_ENV !== "production") {
  globalForEmitter.dashboardEmitter = dashboardEmitter;
}
