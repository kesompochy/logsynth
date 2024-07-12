export default interface LogFetcher {
  fetchLogs(query: string): Promise<string>;
  constructor: Function;
}
