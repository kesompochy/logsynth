import type LogFetcher from "./LogFetcher";
import DatadogLogFetcher from "./DatadogLogFetcher";
import type LogFetcherConfig from "./LogFetcherConfig";

export const LogFetcherFactory = {
  create: (config: LogFetcherConfig): LogFetcher => {
    switch (config.dataSource) {
      case 'Datadog':
        if (!config.datadog) {
          throw new Error('Datadog configuration is required');
        }
        return new DatadogLogFetcher(config.datadog);
    }
  }
}
