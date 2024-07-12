import { client, v2 } from '@datadog/datadog-api-client';
import OpenAI from 'openai';

const configurationOpts = {
  authMethods: {
    apiKeyAuth: process.env.DATADOG_API_KEY,
    appKeyAuth: process.env.DATADOG_APP_KEY,
  },
  httpConfig: {
    compress: false
  },
}

const query = `
source:gcp.http.load.balancer
@data.jsonPayload.enforcedSecurityPolicy.configuredAction:DENY
-@data.jsonPayload.enforcedSecurityPolicy.priority:2147483647
-@data.jsonPayload.enforcedSecurityPolicy.priority:999 
`

const now = new Date()
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

const params: v2.LogsApiListLogsRequest = {
  body: {
    filter: {
      query: query,
      indexes: ["main"],
      from: oneDayAgo.toISOString(),
      to: now.toISOString()
    },
    sort: "timestamp",
    page: {
      limit: 1000
    }
  }
}

const configuration = client.createConfiguration(configurationOpts);
configuration.setServerVariables({
  site: "ap1.datadoghq.com"
})
const apiInstance = new v2.LogsApi(configuration);

const requiredAttributes = [
  "attributes.attributes.publishTime",
  "attributes.attributes.data.httpRequest.requestUrl",
  "attributes.attributes.http.method",
  "attributes.attributes.data.httpRequest.userAgent",
  "attributes.attributes.network.client.ip",
  "attributes.attributes.data.jsonPayload.enforcedSecurityPolicy.preconfiguredExprIds",
  "attributes.attributes.data.jsonPayload.securityPolicyRequestData.remoteIpInfo.regionCode",
]

const getNestedProperty = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

let extractedLogs: string = ""

apiInstance.listLogs(params).then((response: v2.LogsListResponse) => {
  const data = response.data
  data?.forEach((log) => {
    requiredAttributes.forEach((attr) => {
      const value = getNestedProperty(log, attr);
      extractedLogs += attr + ": " + value + "\n"
    })
    extractedLogs += "\n"
  })

  const prompt = `
  Objective:
  
  Analyze the past day's WAF block logs for a web service to detect whether any blocks were likely false positives and require action. The response should be structured in a way that traditional software can handle. The response should include "whether action is needed" and, if action is needed, "the hostname and rule."
  
  
  Background:
  
  1. The web service is based in Japan, and access from abroad is rare.
  2. The ruleset in use is OWASP CRS.
  
  Example Input Data:
  
  The input will be in the following format (example):
  
  \`\`\`
  attributes.attributes.publishTime: 2024-01-01T00:00:00.000Z
  attributes.attributes.data.httpRequest.requestUrl: https://example.com/.env
  attributes.attributes.http.method: GET
  attributes.attributes.data.httpRequest.userAgent: Go-http-client/1.1
  attributes.attributes.network.client.ip: 83.147.52.37
  attributes.attributes.data.jsonPayload.enforcedSecurityPolicy.preconfiguredExprIds: owasp-crs-v030001-id930130-lfi
  attributes.attributes.data.jsonPayload.securityPolicyRequestData.remoteIpInfo.regionCode: CA
  
  ...
  \`\`\`
  
  Output Format:
  
  Whether action is needed or not.
  If action is needed, the time, hostname , rule, and reason.
  Specifically, consider the following criteria to determine if a block is likely a false positive:
  
  1. The access is from Japan (country: "JP")
  2. Based on the OWASP CRS ruleset, determine if the rule might be a false positive.
  
  
  Example Output:
  
  1. Action Needed:
  
  \`\`\`json
  {
    "response": "Action Needed",
    "details": [
      {
        "time": "2024-01-01T00:00:00.000Z",
        "host": "example.com",
        "path": "/upload",
        "rule_id": "owasp-crs-v030001-id942360-sqli",
        "reason": "The structure of the blocked request is typical of non-malicious activity by legitimate users, indicating it may be a false positive."
      }
    ]
  }
  \`\`\`
  
  2. No Action Needed:
  
  \`\`\`json
  {
    "response": "No Action Needed"
  }
  
  Input Data:
  
  ${extractedLogs}
  `;
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
  
  const chatCompletion = openai.chat.completions.create({
    messages: [
      { 
        role: 'system', 
        content: 'You are an expert assistant specialized in analyzing web application firewall (WAF) logs to detect false positives. Your task is to determine if any blocks were likely false positives and require action. Provide structured responses that traditional software can handle, including "whether action is needed" and, if action is needed, "the hostname and rule."'
      },
      { 
        role: 'user',
        content: prompt
      }
    ],
    model: 'gpt-4o'
  }).then((response) => {
    if (!response.choices[0].message.content) {
      console.error('No response choices found');
      return
    }
    const responseJson = parseResponse(response.choices[0].message.content)
    if(responseJson.response === 'Action Needed') {
      console.log('Action Needed')
      console.log(responseJson.details)
    } else {
      console.log('No Action Needed')
    }
  })
  
})

export const parseResponse = (responseContent: string) => {
  const jsonStartIndex = responseContent.indexOf('{');
  const jsonEndIndex = responseContent.lastIndexOf('}') + 1;
  const jsonString = responseContent.substring(jsonStartIndex, jsonEndIndex);

  // Parse the JSON string
  let jsonResponse;
  try {
    jsonResponse = JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }

  return jsonResponse;
}

