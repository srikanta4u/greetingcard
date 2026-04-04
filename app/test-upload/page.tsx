import { redirect } from "next/navigation";
import { TestUploadClient } from "./upload-client";

export default function TestUploadPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/");
  }

  return <TestUploadClient />;
}
