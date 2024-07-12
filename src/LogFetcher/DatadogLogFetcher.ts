import type LogFetcher from "./LogFetcher";
import { client, v2 } from '@datadog/datadog-api-client';
import getNestedProperty from "./utils/getNestedProperty";

export interface DatadogLogFetcherConfig {
  apiKey: string;
  appKey?: string;
  site?: string;
  index?: string;
  from?: Date;
  to?: Date;
  sort?: 'timestamp';
  limit?: number;
  requiredAttributes?: string[];
}

const configurationOpts = {
  authMethods: {
    apiKeyAuth: process.env.DATADOG_API_KEY,
    appKeyAuth: process.env.DATADOG_APP_KEY,
  },
  httpConfig: {
    compress: false
  },
}

export default class DatadogLogFetcher implements LogFetcher {
  apiInstance: v2.LogsApi;
  params: v2.LogsApiListLogsRequest;
  requiredAttributes: string[];
  constructor(config: DatadogLogFetcherConfig) {
    const dataDogconfig = client.createConfiguration(configurationOpts);
    if (config.site) {
      dataDogconfig.setServerVariables({
        site: config.site
      })
    }
    this.apiInstance = new v2.LogsApi(dataDogconfig);
    this.params = {
      body: {
        filter: {
          query: "",
          indexes: [config.index || "main"],
          from: config.from?.toISOString(),
          to: config.to?.toISOString()
        },
        sort: config.sort || "timestamp",
        page: {
          limit: config.limit || 1000
        }
      }
    }
    this.requiredAttributes = config.requiredAttributes || []
  }
  async fetchLogs(query: string): Promise<string> {
    this.params!.body!.filter!.query = query
    const response = await this.apiInstance.listLogs(this.params)
    let logs = ""
    response.data?.forEach((log) => {
      this.requiredAttributes.forEach((attr) => {
        const value = getNestedProperty(log, attr);
        logs += attr + ": " + value + "\n"
      })
      logs += "\n"
    })

    return logs
  }
}
