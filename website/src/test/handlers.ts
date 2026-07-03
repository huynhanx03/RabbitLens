import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("http://localhost/api/whoami", ({ request }) => {
    const auth = request.headers.get("Authorization");
    // "guest:guest" -> Basic Z3Vlc3Q6Z3Vlc3Q=
    if (!auth || auth !== "Basic Z3Vlc3Q6Z3Vlc3Q=") {
      return HttpResponse.json(
        { error: "not_authorized", reason: "Not authorized" },
        { status: 401 }
      );
    }
    
    return HttpResponse.json({
      name: "guest",
      tags: ["administrator"],
      is_internal_user: true,
      login_session_timeout: 120,
    });
  }),
  http.get("http://localhost/api/overview", () => {
    return HttpResponse.json({
      rabbitmq_version: "4.0.0",
      erlang_version: "27.0",
      management_version: "4.0.0",
      cluster_name: "test-cluster",
      disable_stats: false,
    });
  }),
  http.get("http://localhost/api/extensions", () => {
    return HttpResponse.json([]);
  }),
  http.get("http://localhost/api/nodes", () => {
    return HttpResponse.json([]);
  }),
  http.get("http://localhost/api/connections", () => {
    return HttpResponse.json({ items: [], filtered_count: 0, total_count: 0 });
  }),
  http.get("http://localhost/api/channels", () => {
    return HttpResponse.json({ items: [], filtered_count: 0, total_count: 0 });
  }),
  http.get("http://localhost/api/exchanges", () => {
    return HttpResponse.json({ items: [], filtered_count: 0, total_count: 0 });
  }),
  http.get("http://localhost/api/queues", () => {
    return HttpResponse.json({ items: [], filtered_count: 0, total_count: 0 });
  }),
];
