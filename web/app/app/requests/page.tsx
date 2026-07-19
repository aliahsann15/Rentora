import { RequestsPage } from "@/features/requests/requests-page";

type RequestsRouteProps = {
  searchParams?: Promise<{
    search?: string | string[];
  }>;
};

export default async function RequestsRoute({ searchParams }: RequestsRouteProps) {
  const params = await searchParams;
  const search = Array.isArray(params?.search) ? params.search[0] : params?.search;
  const initialQuery = search || "";

  return <RequestsPage initialQuery={initialQuery} key={initialQuery} />;
}
