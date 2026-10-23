import { expect } from "chai";
import request from "supertest";

import { initMetrics } from "#/app/metrics.js";
import { createMockApp } from "#tests/unit/utils.js";

describe("Prometheus metrics", () => {
  function createMetricsApp() {
    const app = createMockApp({ useCsrf: false });
    initMetrics(app);
    app.get("/applications/:applicationId", (_req, res) => res.sendStatus(200));
    app.get("/failure", (_req, res) => res.sendStatus(500));
    app.get("/health", (_req, res) => res.sendStatus(200));
    return app;
  }

  it("exports process metrics without authentication or a session cookie", async () => {
    const response = await request(createMetricsApp())
      .get("/metrics")
      .expect(200);

    expect(response.headers["content-type"]).to.include("text/plain");
    expect(response.headers["cache-control"]).to.equal("no-store");
    expect(response.headers["set-cookie"]).to.equal(undefined);
    expect(response.text).to.include("rcw_process_cpu_user_seconds_total");
  });

  it("records latency and status using route patterns without URL data", async () => {
    const app = createMetricsApp();
    await request(app)
      .get("/applications/example-id?search=private-value")
      .expect(200);
    await request(app).get("/failure").expect(500);
    await request(app).get("/unknown-value").expect(404);

    const { text } = await request(app).get("/metrics").expect(200);

    expect(text).to.include(
      'rcw_http_requests_total{method="GET",route="/applications/:applicationId",status_code="200"} 1',
    );
    expect(text).to.include(
      'rcw_http_request_duration_seconds_count{method="GET",route="/applications/:applicationId",status_code="200"} 1',
    );
    expect(text).to.include('route="/failure",status_code="500"} 1');
    expect(text).to.include('route="unmatched",status_code="404"} 1');
    expect(text).not.to.include("example-id");
    expect(text).not.to.include("private-value");
    expect(text).not.to.include("unknown-value");
  });

  it("excludes scrapes and health probes from application traffic", async () => {
    const app = createMetricsApp();
    await request(app).get("/metrics").expect(200);
    await request(app).get("/health").expect(200);
    const { text } = await request(app).get("/metrics").expect(200);

    expect(text).not.to.include('route="/metrics"');
    expect(text).not.to.include('route="/health"');
  });

  it("keeps registries isolated between application instances", async () => {
    const first = createMetricsApp();
    const second = createMetricsApp();
    await request(first).get("/failure").expect(500);

    const { text } = await request(second).get("/metrics").expect(200);
    expect(text).not.to.include('route="/failure"');
  });
});
