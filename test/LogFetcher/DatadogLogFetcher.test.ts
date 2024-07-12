import DatadogLogFetcher from "~/LogFetcher/DatadogLogFetcher";

describe('DatadogLogFetcher', () => {
  it("should have a API Instance", () => {
    const logFetcher = new DatadogLogFetcher({ apiKey: '123' });
    expect(logFetcher.apiInstance).toBeDefined();
  })
  it('should fetch logs', async () => {
    const logFetcher = new DatadogLogFetcher({ apiKey: '123' });
    const logs = await logFetcher.fetchLogs('query');
    expect(logs).toBe('Datadog logs');
  });
})
