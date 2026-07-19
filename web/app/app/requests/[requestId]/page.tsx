"use client";

import { useParams } from "next/navigation";
import { RequestDetailPage } from "@/features/requests/request-detail-page";

export default function RequestDetailRoute() {
  const params = useParams();
  const rawRequestId = params?.requestId;
  const requestId = Array.isArray(rawRequestId) ? rawRequestId[0] : typeof rawRequestId === "string" ? rawRequestId : "";

  return <RequestDetailPage requestId={requestId} />;
}
