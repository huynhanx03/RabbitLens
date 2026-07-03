import { createMemoryHistory, createRootRoute, createRouter } from "@tanstack/react-router";

export function createTestRouter(component: React.ComponentType) {
  const rootRoute = createRootRoute({
    component: component as any,
  });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return router;
}
