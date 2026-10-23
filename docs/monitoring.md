# Prometheus Monitoring and Alerting

## Metrics

RCW exposes Prometheus text metrics on `GET /metrics` on its existing application port, 3000. The endpoint is registered before sessions, CSRF, rate limiting and authentication so a failed Redis connection or expired session cannot prevent a scrape. Registries are isolated per application instance.

The endpoint provides:

- `rcw_http_requests_total`: completed responses labelled by method, matched route pattern and status code.
- `rcw_http_request_duration_seconds`: a histogram of response durations in seconds, with the same labels and the Node client library's default buckets.
- Standard Node.js process metrics, prefixed with `rcw_` (CPU, memory, event loop and garbage collection).

HTTP labels never include raw URLs, query parameters, user/session identifiers or dynamic router mount paths. The route label is the final matched route pattern, not the full mounted URL; identical route patterns in different routers are aggregated. Unmatched routes use `unmatched`. Non-standard methods use `OTHER`. Metrics requests and `/health` and `/status` probes are excluded from HTTP metrics. Responses that never finish are not counted.

These are RCW application metrics, not end-to-end ingress or CCQ metrics. Use Cloud Platform's ingress metrics for NGINX failures and requests handled directly by CCQ.

## Scraping

The Helm chart enables `monitoring.enabled` by default. It creates a `ServiceMonitor` that selects only the release's RCW service and scrapes its named `http` port at `/metrics` every 15 seconds, with a 10-second timeout. Namespace and service labels supplied by Prometheus scope the alert queries to this release.

The existing RCW network policy admits TCP port 3000 from namespaces labelled `component: monitoring`, in addition to the existing NGINX and CCQ access. The namespace label must exist in the target cluster. Public NGINX requests to `/metrics` are rejected with 404, including case variants and trailing slashes; Prometheus contacts the RCW service directly.

The cluster must have the Prometheus Operator CRDs and discover ServiceMonitors in the application namespace. If discovery requires extra ServiceMonitor labels, set `monitoring.serviceMonitorLabels` to the cluster's configured selector. For local clusters without the CRDs, set `monitoring.enabled: false`. This omits monitoring resources and the monitoring ingress permission, but does not remove application instrumentation or change existing application access.

## Alert Routing

Scraping does not configure notifications. Alert rules are disabled by default because Cloud Platform requires an agreed, team-specific Alertmanager route and custom severity value.

1. Follow [Creating your own custom alerts](https://user-guide.cloud-platform.service.justice.gov.uk/documentation/monitoring-an-app/how-to-create-alarms.html): arrange the Slack webhook, store it in a Kubernetes Secret, and request a route from Cloud Platform. Do not commit the webhook or other credentials.
2. Obtain the custom severity value from Cloud Platform.
3. Add the following to the appropriate environment values file, replacing the example severity with the supplied value:

   ```yaml
   monitoring:
     alerts:
       enabled: true
       severity: supplied-by-cloud-platform
   ```

4. Deploy through the existing pipeline, which already loads the environment values file. Verify that a controlled test alert reaches the intended receiver before relying on notifications.

The chart renders `PrometheusRule` with `role: alert-rules` and rejects alert enablement with an empty severity. Set alerts per environment deliberately; UAT branch releases share their environment's values. Each release's rules query only its own service. For rule recovery after a Prometheus CRD reinstall, follow Cloud Platform's recommendation to manage a recoverable copy in the environments repository or redeploy this chart; avoid maintaining two active copies of the same rules.

## Rules

| Alert                      | Condition                                                                  | Pending Duration |
| -------------------------- | -------------------------------------------------------------------------- | ---------------- |
| `RCWMetricsUnavailable`    | A scrape target is down, or the service has no discovered targets          | 5 minutes        |
| `RCWHighErrorRate`         | More than 5% of completed responses are 5xx over a rolling 5-minute window | 5 minutes        |
| `RCWHighLatency`           | p95 response duration exceeds 1 second over a rolling 5-minute window      | 10 minutes       |
| `RCWDeploymentUnavailable` | Available RCW deployment replicas are fewer than desired                   | 10 minutes       |

Error and latency rules require at least 100 requests in the rolling window to avoid low-traffic noise. Tune `monitoring.alerts.errorRateThreshold`, `latencyThresholdSeconds` and `minimumRequests` against observed traffic and agreed service objectives; these defaults are starting points, not established SLOs. Replica alerts rely on Cloud Platform's kube-state-metrics. They intentionally do not alert for a deployment scaled to zero. Cloud Platform's standard pod alerts complement these rules for container crashes.

When metrics are unavailable, check ServiceMonitor discovery, service endpoints, RCW pod logs and network policies. For high errors or latency, check application errors, Redis, upstream APIs and CPU/memory saturation. For unavailable replicas, check rollout status, pod events, image pulls and readiness probes.

## Rollout Checks

Use the release name and namespace from the existing deployment. For the main release, the RCW service and deployment are both named `laa-record-controlled-work-rcw`.

```sh
kubectl -n <namespace> get servicemonitor,prometheusrule
kubectl -n <namespace> get endpointslice -l kubernetes.io/service-name=laa-record-controlled-work-rcw
kubectl -n <namespace> port-forward service/laa-record-controlled-work-rcw 3000:3000
```

In another terminal:

```sh
curl --fail http://localhost:3000/metrics
curl -o /dev/null -w '%{http_code}\n' https://<public-host>/metrics
```

The first request must return Prometheus metrics and the public request must return 404. Port forwarding checks exposition only; confirm actual cross-namespace scraping in [Prometheus](https://prometheus.cloud-platform.service.justice.gov.uk/) using:

```promql
up{namespace="<namespace>", service="laa-record-controlled-work-rcw"}
```

Expect one `1` per ready RCW scrape target. Generate application traffic, then confirm request counters and histogram buckets appear. Inspect the four rules in Prometheus and their route in [Alertmanager](https://alertmanager.cloud-platform.service.justice.gov.uk/). Do not deliberately disrupt production to test alerts.

## Local Validation

Use the repository's Node version. Helm and `promtool` are also needed for deployment checks; the final command additionally uses Mike Farah's `yq`.

```sh
yarn exec mocha tests/unit/src/app/metrics.spec.ts
yarn exec tsc --noEmit -p tsconfig.build.json
yarn exec eslint src/app.ts src/app/metrics.ts
helm lint deploy/laa-record-controlled-work
helm template metrics-check deploy/laa-record-controlled-work \
  --namespace monitoring-check \
  --set monitoring.alerts.enabled=true \
  --set monitoring.alerts.severity=validation-only \
  --show-only templates/rcw.prometheusrule.yaml \
  | yq '.spec' | promtool check rules /dev/stdin
```

`validation-only` is solely for local rendering, not an Alertmanager routing value. Repeat rendering with each environment values file before rollout. Cluster-side checks remain necessary to verify CRD permissions, namespace labels, discovery selectors, kube-state-metrics availability and notification delivery.
