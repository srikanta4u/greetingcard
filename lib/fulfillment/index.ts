import { MockPrintVendorAdapter } from "./mockAdapter";
import type { PrintVendorAdapter } from "./types";

export type { PrintAddress, PrintOrder, PrintResult, PrintVendorAdapter } from "./types";
export { MockPrintVendorAdapter } from "./mockAdapter";

export function getAdapter(): PrintVendorAdapter {
  const vendor = (process.env.PRINT_VENDOR ?? "mock").toLowerCase().trim();
  if (vendor === "mock" || vendor === "") {
    return new MockPrintVendorAdapter();
  }
  // Future: if (vendor === "prodigi") return new ProdigiAdapter();
  console.warn(
    `[fulfillment] Unknown PRINT_VENDOR "${process.env.PRINT_VENDOR}", falling back to mock`,
  );
  return new MockPrintVendorAdapter();
}
