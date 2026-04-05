export type PrintAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type PrintOrder = {
  orderId: string;
  frontImageUrl: string;
  backImageUrl?: string;
  personalization: Record<string, unknown>;
  recipientName: string;
  address: PrintAddress;
  messageText: string;
  font: string;
  color: string;
};

export type PrintResult = {
  orderId: string;
  jobId: string;
  status: "accepted" | "failed";
  error?: string;
};

export interface PrintVendorAdapter {
  submitBatch(orders: PrintOrder[]): Promise<PrintResult[]>;
}
