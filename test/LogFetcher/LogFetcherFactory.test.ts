import { LogFetcherFactory } from '~/LogFetcher/LogFetcherFactory'

describe("LogFetcherFactory", () => {
  it("should create a LogFetcher", () => {
    const logFetcher = LogFetcherFactory.create({ dataSource: 'Datadog', datadog: { apiKey: '123' }, query: 'query'});
    expect(logFetcher).toBeDefined();
  })
  it("should throw an error if the dataSource is not supported", () => {
    const logFetcher = LogFetcherFactory.create({ dataSource: 'Unsupported' as any, query: 'query'});
    expect(logFetcher).toBeUndefined();
  });
})
