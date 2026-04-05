import type { PrintOrder, PrintResult, PrintVendorAdapter } from "./types";

const BATCH_DELAY_MS = 500;

export class MockPrintVendorAdapter implements PrintVendorAdapter {
  async submitBatch(orders: PrintOrder[]): Promise<PrintResult[]> {
    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));

    return orders.map((o) => {
      const jobId = `MOCK-${o.orderId.slice(0, 8)}`;
      const ok = Math.random() < 0.9;
      if (ok) {
        return {
          orderId: o.orderId,
          jobId,
          status: "accepted",
        };
      }
      return {
        orderId: o.orderId,
        jobId,
        status: "failed",
        error: "Mock vendor simulated rejection",
      };
    });
  }
}
