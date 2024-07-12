import { LogFetcherFactory } from '~/LogFetcher/LogFetcherFactory';
import AI from '~/AI/AI';
import Output from '~/Output/Output';
import type LogFetcherConfig from '~/LogFetcher/LogFetcherConfig';

const config: LogFetcherConfig = {
  dataSource: 'Datadog',
  datadog: {
    apiKey: 'aaa'
  },
  query: 'query'
}

const main = () => {
  const logFetcher = LogFetcherFactory.create(config);
  const ai = new AI();
  const output = new Output();

  const logs = logFetcher.fetchLogs(config.query);
  const result = ai.analyze(logs);
  output.output(result);
}

export default main;
