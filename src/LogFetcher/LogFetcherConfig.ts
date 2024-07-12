import type { DatadogLogFetcherConfig } from './DatadogLogFetcher';

export default interface LogFetcherConfig {
  dataSource: 'Datadog';
  query: string;
  datadog?: DatadogLogFetcherConfig;
}
