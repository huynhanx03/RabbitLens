import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueueDetailPage } from "./queue-detail-page";
import { mockQueue } from "@/test/fixtures/queues";

const mockClient = {
  request: vi.fn(),
  requestVoid: vi.fn(),
};

vi.mock("@/components/shared/rate-chart", () => ({
  RateChart: ({
    title,
    isAvailable,
  }: {
    title: string;
    isAvailable: boolean;
  }) => <div data-available={String(isAvailable)}>{title}</div>,
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useRouteContext: () => ({
      apiClient: mockClient,
      auth: { user: { name: "admin", tags: ["administrator"] } },
    }),
    useNavigate: () => vi.fn(),
    Link: ({ children, className }: ComponentProps<"a">) => (
      <a href="#exchange" className={className}>
        {children}
      </a>
    ),
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const overview = {
  disable_stats: false,
  rates_mode: "detailed",
  enable_queue_totals: true,
  object_totals: {},
  message_stats: {},
};

const bindings = [
  {
    source: "",
    vhost: "/",
    destination: "my-queue",
    destination_type: "queue",
    routing_key: "my-queue",
    arguments: {},
    properties_key: "my-queue",
  },
  {
    source: "pentest.response",
    vhost: "/",
    destination: "my-queue",
    destination_type: "queue",
    routing_key: "scan.#",
    arguments: {},
    properties_key: "scan.%23",
  },
];

const queueWithHistory = {
  ...mockQueue,
  messages_details: {
    rate: 0,
    samples: [
      { timestamp: 1_783_851_200, sample: 15 },
      { timestamp: 1_783_851_205, sample: 16 },
    ],
  },
  messages_ready_details: {
    rate: 0,
    samples: [
      { timestamp: 1_783_851_200, sample: 10 },
      { timestamp: 1_783_851_205, sample: 11 },
    ],
  },
  messages_unacknowledged_details: {
    rate: 0,
    samples: [
      { timestamp: 1_783_851_200, sample: 5 },
      { timestamp: 1_783_851_205, sample: 5 },
    ],
  },
};

function mockQueueDetailRequests({
  extensions = [],
  queue = mockQueue,
  overviewResponse = overview,
}: {
  extensions?: Array<{ javascript_src: string }>;
  queue?: typeof mockQueue;
  overviewResponse?: typeof overview;
} = {}) {
  mockClient.request.mockImplementation(async (path: string) => {
    if (path === "/overview") return overviewResponse;
    if (path === "/extensions") return extensions;
    if (path.includes("/bindings")) return bindings;
    if (path.startsWith("/exchanges/")) {
      return {
        name: "pentest.response",
        vhost: "/",
        type: "topic",
        durable: true,
        auto_delete: false,
        internal: false,
        arguments: {},
      };
    }
    return queue;
  });
}

describe("QueueDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders topology-first configuration and keeps count history", async () => {
    mockQueueDetailRequests({ queue: queueWithHistory });

    render(
      <QueueDetailPage
        vhost="/"
        name="my-queue"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getAllByText("classic").length).toBeGreaterThan(0);
      expect(screen.getAllByText("rabbit@localhost").length).toBeGreaterThan(0);
      expect(screen.getByText("D")).toBeInTheDocument();
      expect(screen.getByText("running")).toBeInTheDocument();
    });

    expect(screen.getByRole("region", { name: "Configuration" })).toBeVisible();
    expect(screen.getByText("Queue declaration")).toBeVisible();
    expect(screen.getByText("pentest.response")).toBeVisible();
    expect(screen.getByText("topic")).toBeVisible();
    expect(screen.getByText("scan.#")).toBeVisible();
    expect(screen.getByText(/x-max-priority:/)).toBeVisible();
    expect(screen.getByText("Message counts history")).toBeVisible();
    expect(screen.queryByText("Message rates history")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Message inspector" }),
    ).not.toBeInTheDocument();

    const readyCounts = screen.getAllByText("10");
    expect(readyCounts.length).toBeGreaterThan(0);
    const unackedCounts = screen.getAllByText("5");
    expect(unackedCounts.length).toBeGreaterThan(0);
    const totalCounts = screen.getAllByText("15");
    expect(totalCounts.length).toBeGreaterThan(0);

    await userEvent.click(
      screen.getByRole("button", { name: "Message diagnostics" }),
    );
    expect(
      screen.getByRole("region", { name: "Message inspector" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Load snapshot" })).toBeVisible();
  });

  it("shows count history as unavailable when samples cannot be polled", async () => {
    mockQueueDetailRequests({
      queue: queueWithHistory,
      overviewResponse: { ...overview, rates_mode: "none" },
    });

    render(<QueueDetailPage vhost="/" name="my-queue" />, {
      wrapper: createWrapper(),
    });

    expect(await screen.findByText("Message counts history")).toHaveAttribute(
      "data-available",
      "false",
    );
  });

  it("opens queue publishing with the default-exchange routing key locked", async () => {
    mockQueueDetailRequests();

    render(<QueueDetailPage vhost="/" name="my-queue" />, { wrapper: createWrapper() });

    await userEvent.click(await screen.findByRole("button", { name: "Publish message" }));
    expect(screen.getByLabelText("Routing key")).toHaveValue("my-queue");
    expect(screen.getByLabelText("Routing key")).toBeDisabled();
  });

  it("offers move messages only when Shovel Management is available", async () => {
    mockQueueDetailRequests({
      extensions: [{ javascript_src: "shovel.js" }],
    });
    render(<QueueDetailPage vhost="/" name="my-queue" />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Move messages" })).toBeVisible();
  });

  it("offers synchronization actions only for legacy mirrored queues", async () => {
    mockQueueDetailRequests({
      queue: {
        ...mockQueue,
        slave_nodes: ["rabbit@two"],
        synchronised_slave_nodes: [],
      },
    });
    render(<QueueDetailPage vhost="/" name="my-queue" />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Synchronize mirrors" })).toBeVisible();
  });
});
