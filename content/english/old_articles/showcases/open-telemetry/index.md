---
title: OpenTelemetry - stepping into gno.land's observability tools
publishDate: 2025-01-30T08:00:00-01:00
translationKey: "open-telemetry"
tags: [ "gnoland", "devops", "observability", "OpenTelemetry", "metrics", "otel" ]
level: Intermediate
author: sw360cab
summary: This showcase is about the gno.land approach to OpenTelemetry and to its own observability stack.
---

## What is OTel

OpenTelemetry (OTel) is a specification that translates into APIs and SDKs for collecting and analyzing telemetry data by instrumenting code of a target application.
Telemetries are intended in the form of three types:

- `Metrics`, a measurement captured at runtime.
- `Traces`, the path of a request through the application.
- `Logs`, a recording of an event.

Code should be instrumented, meaning making it capable of emitting telemetry data. This can be:

- code-based, explicitly adopting a specific SDK and adding specific instructions into the codebase
- zero-code, when the code cannot be modified, by providing information about what’s happening at the edges of the application

The relevant components in the OpenTelemetry landscapes are:

- **Data**: Defined in the OpenTelemetry Protocol (OTLP) and with vendor-agnostic semantic conventions
- **OpenTelemetry Collector**: a vendor-agnostic proxy that can receive, process, and export telemetry data. Data can be in multiple formats (OTLP, Jaeger, Prometheus) and can be exported to one or more backends
- **Observability Backends**: Specific services able to elaborate observability data using proprietary technologies (e.g. Prometheus, Jaeger, Zipkin)

All this data facilitates the analysis of the performances of a specific instrumented application, allowing the `observability`.

## Why OTel

OpenTelemetry is a free and open source technology and it does not depend on any other system, service or technology, in this way we can maximize the possibilities of integration with other services and technologies and minimize or totally avoid the vendor lock-in.

## OTel in Gnoland

First of all, the current version of Gnoland will focus on OpenTelemetry metrics, traces may come next in a short time.
All the gno.land code has been actively instrumented to collect a predefined set of metrics, mainly `counters` and `histograms` and some `gauges`. the code has been explicitly instrumented using the official [Go SDK](https://opentelemetry.io/docs/languages/go/).

The reference file setting up OpenTelemetry in the official [Gno repository](https://github.com/gnolang/gno) is at [tm2/pkg/telemetry/metrics/metrics.go](https://github.com/gnolang/gno/blob/master/tm2/pkg/telemetry/metrics/metrics.go).
This holds an init method which is in charge of creating the metric provider, which in turn will be collecting the instrumented metrics and exporting them periodically to either an http or a grpc endpoint.

Here the relevant source code:

```go
//Exporter setup
func Init(config config.Config) error {
 ...
  // Use oltp metric exporter with http/https or grpc
  switch u.Scheme {
  case "http", "https":
    exp, err = otlpmetrichttp.New(
      ctx,
      otlpmetrichttp.WithEndpointURL(config.ExporterEndpoint),
    )
    if err != nil {
      return fmt.Errorf("unable to create http metrics exporter, %w", err)
    }
  default:
    exp, err = otlpmetricgrpc.New(
      ctx,
      otlpmetricgrpc.WithEndpoint(config.ExporterEndpoint),
      otlpmetricgrpc.WithInsecure(),
    )
    if err != nil {
      return fmt.Errorf("unable to create grpc metrics exporter, %w", err)
    }
  }

  // creating metric provider
  provider := sdkMetric.NewMeterProvider(
    // Default period is 1m
    sdkMetric.WithReader(sdkMetric.NewPeriodicReader(exp)),
    sdkMetric.WithResource(
      resource.NewWithAttributes(
        semconv.SchemaURL,
        semconv.ServiceNameKey.String(config.ServiceName),
        semconv.ServiceVersionKey.String("1.0.0"),
        semconv.ServiceInstanceIDKey.String(config.ServiceInstanceID),
      ),
    ),
  )

  // instrument OTel SDK
  OTel.SetMeterProvider(provider)
  meter := provider.Meter(config.MeterName)
  //...
}
```

Throughout the instrumentation part, convention over configuration has been heavily adopted. For each metric a `const` is defined, the latter is used as key to instrument the metric, which in turn is saved into an exported `var`, which represents the metric handler.

```go
const numMempoolTxsKey = "num_mempool_txs_hist"

var NumMempoolTxs metric.Int64Histogram

if NumMempoolTxs, err = meter.Int64Histogram(
  numMempoolTxsKey,
  metric.WithDescription("valid mempool transaction count"),
); err != nil {
  return fmt.Errorf("unable to create histogram, %w", err)
}
```

The instrumented item will be used somewhere else within the codebase to collect the corresponding metric.

```go
// logTelemetry logs the mempool telemetry
func (mem *CListMempool) logTelemetry() {
if !telemetry.MetricsEnabled() {
  return
}

// Log the total number of mempool transactions
metrics.NumMempoolTxs.Record(context.Background(), int64(mem.txs.Len()))
}
```

Note that if the telemetry is not explicitly enabled, no attempt to access the metric handler will be made.

## Gnoland Binary setup

Since relevant parts of code have been already instrumented, what is missing is setting up the relevant section of OpenTelemetry in the configuration file.

The following configuration items are available in Gno setup:

- `telemetry.enabled`, whether telemetry is enabled
- `telemtery.exporter_endpoint`, the endpoint to export metrics to
- `telemtetry.meter_name`, name of the meter, meaning the entity the will create instruments for the application
- `telemetry.service_instance_id`, an instance id to identify the current instance emitting the metrics
- `telemetry.service_name`, a generic name to identify the service running, for example a testnet or a validator set

All the previous name references will be included in each metric emitted by the Gnoland application.

## OpenTelemetry in action: Orchestrating multiple services in Docker

In order to see OpenTelemetry in action we need

- a set of observability tools
- an instrumentable application, Gnoland!

To the first group belong:

- OpenTelemetry collector
- Prometheus as backend, receiving data exported by the OTel Collector
- Grafana as UI to visualize results in a set of visual panels, configured to elaborate data collected by Prometheus

For the application part we will use:

- a Gno validator that starts producing blocks
- [Supernova](https://github.com/gnolang/supernova), the stress-testing Gno networks tool, to generate some traffic as transactions created (package deployment)
- an RPC node, used as handy communication tier between the Gno validator and Supernova

The complete docker compose file for the orchestrated services can be found in the `misc/telemetry` [directory on GitHub](https://github.com/gnolang/gno/tree/master/misc/telemetry).

You can launch the services using from the Gno repository folder:

```bash
cd misc/telemetry
docker compose up -d
```

### Instrumenting applications

When using the Gnoland binary, instrumenting the application is just one step to the side. As said before it is important to just enable telemetry from config, the `telemetry.enabled` entry, providing an endpoint to the collector, `telemetry.exporter_endpoint`.
Then to identify a current set of applications, like a validator set, a generic service name can be added via `telemetry.service_name`, together with the unique name given the specific instance providing metrics, using `telemetry.service_instance_id`.
These last two parameters will be included as labels in each metric emitted by the instrumented application.

The validator node will generate secrets, adjust config to enable telemetry and produce labeled metrics and it will also generate a genesis file having the validator itself within the validator set entries.

The RPC service will wait for the validator node to be up and running and share the genesis file to boot itself. It will not only be useful as the endpoint for Supernova, but also to produce other OTel metrics, labeled with a different source service (`telemetry.service_instance_id = rpc000`).

Periodically `Supernova` will rerun and by connecting through the RPC service it will increase the amount of data that the observability stack can consume. It is possible to manually stop Supernova to avoid running it infinitely.

### Configuring the observability stack

As seen above the key component of the OTel observability environment is the `collector`. It is in charge of communicating from one side with the instrumented applications and from the other side with a backend which receives exported data.

We can put together what we have seen before, our collector setup will be able to:

- gather metrics from a `grpc interface` exposed by the collector itself and accessed by the application
- collect only metrics, no traces or logs
- expose data to a Prometheus backend on a given port (in this case we picked port 8090)

Here is the simple and final configuration of the collector

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  batch:

exporters:
  prometheus:
    endpoint: collector:8090

service:
  telemetry:
    logs:
      level: "debug"
  pipelines:
    metrics:
      receivers: [ otlp ]
      processors: [ batch ]
      exporters: [ prometheus ]
```

`Prometheus` will receive data from the collector. The only configuration needed is a dedicated `scraper` connecting to the collector using the endpoint where Prometheus is expecting data to be gathered from. In this specific case we will use a local service name with the designed port, so the final endpoint will be: `collector:8090`.

```yaml
scrape_configs:
  - job_name: 'OpenTelemetry'
    static_configs:
      - targets: [ 'collector:8090' ]
```

`Grafana` is the last and final tier and it will in turn gather data from Prometheus at a specific port (predefined is `9090`), by configuring a specific datasouce. Then this data should be combined in a meaningful way to be shown in several UI panels. Eventually those panels are combined together into a dashboard, the OTel dashboard in this case.

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    uid: prometheus
    ...
```

The metrics exposed can be used and combined in various ways and depending on the metric type, they are provided with additional data that allows meaningful aggregations.

For example a metric of type `histogram` will expose three metrics named using convention over configuration suffixes:

- ***_count***, counting the number of samples
- ***_sum***, summing up the value of all samples
- a set of multiple buckets ***_bucket*** with a label ***le***, which contains a count of all samples whose values are less than or equal to the numeric value contained in the le label.

These data can be combined together using specific expressions. One of them can be useful to understand the trend of values in a given period of time by leveraging the formula `rate(hist_sum)/rate(hist_count)`.

For example, referencing the metric `vm_gas_used_hist` collecting the gas used by VM executions in Gno, can be aggregated to retrieve the average gas used, with the following formula:

```c
rate(vm_gas_used_hist_sum)/rate(vm_gas_used_hist_count)
```

Indeed for a gauge metric, like `inbound_peers_gauge`, that holds the number of inbound peers for a validator, we can use another common expression using the `avg_over_time()` function to obtain the average inbound peer count.

```c
avg_over_time(inbound_peers_gauge)
```

Of course it is useful to add additional parameters to the previous expressions to define a time range and pointing to a specific application instance, represented by the `node` parameter. The final expression looks like that:

```c
rate(vm_gas_used_hist_sum{exported_instance=~"${node}"}[$__rate_interval])/rate(vm_gas_used_hist_count{exported_instance=~"${node}"}[$__rate_interval])
```

As said `node` is s reference variable defined in Grafana, which queries Prometheus with the following expression:

```c
label_values(exported_instance)
```

where `exported_instance` is a label contained in each metric and defined and added by the instrumented application. In this specific case we can distinguish metrics referring to the validator node and to the RPC node.

## Moving resource into a Kubernetes cluster

After creating the setup in a Docker Compose environment, moving toward Kubernetes is the next expected step.
Let's see what we have and what we need to adapt to make it working in a Kubernetes environment.

- `OpenTelemetry collector`: this will become a fresh pair of deployment/service combo in the Kube

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: open-telemetry
spec:
  replicas: 1
  selector:
    matchLabels:
      app: otel-run
  template:
    metadata:
      labels:
        app: otel-run
    spec:
      containers:
        - name: otel
          image: otel/OpenTelemetry-collector-contrib:0.111.0
          ports:
            - name: otlp-http
              containerPort: 4317
            - name: otlp-grpc
              containerPort: 4318
            - name: otlp-exporter
              containerPort: 8889
...

---

apiVersion: v1
kind: Service
metadata:
  name: otel-svc
  namespace: monitoring
spec:
  selector:
    app: otel-run
  ports:
    - name: otlp-http
      port: 4317
      targetPort: otlp-http
    - name: otlp-exporter
      port: 8889
      targetPort: otlp-exporter

```

- `Prometheus`: given a deployed Prometheus stack in Kubernetes (deployment + service) it only needs to be provided with the right scrape config, which should point to the endpoint made available by the OTel collector exposed by the Kubernetes service

```yaml
  - job_name: 'OpenTelemetry'
    static_configs:
      - targets: [ 'collector:8090' ]
```

- `Grafana`: what is needed in a common Grafana configuration provided with a Prometheus datasource, is the addition of the dedicated dashboard into the list of available ones. The dashboard is not far from what was configured in the Docker Compose version.
As long as the Prometheus datasource is available, the same dashboard configuration will display the UI panels the same way.

- `Gnoland binary`: what is needed is just a valid configuration enabling OTel and pointing to the right endpoint of the OTel collector.
This configuration should be provided at boot time, in Kubernetes this is possible by leveraging an [initContainer](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/).
In particular it is important to point to the right Kubernetes service representing the OTel collector. In order to follow the above configuration the endpoint will look like: `otel-svc.svc.cluster.local:4317`.

```yaml
...
initContainers:
- name: init-config
  image: ghcr.io/gnolang/gno/gnoland:{{ .Values.global.binaryVersion }}
  command:
  - sh
  - -c
  - |
    gnoland config set telemetry.enabled true
    gnoland config set telemetry.service_instance_id val-01
    gnoland config set telemetry.exporter_endpoint otel-svc.svc.cluster.local:4317
...
```

## Conclusion

We have seen here why and how Open Telemetry was adopted in Gnoland. Moreover we have been able to introduce OTel into the observability stack,
first in a simple Docker Compose and then in Kubernetes.
Finally OpenTelemetry became part of the observability stack in Gnoland!
