import { parseResponse } from "../index";
import fs from 'fs';
import path from 'path';

describe("parseResponse", () => {
  it("should parse the structured response correctly", () => {
    const testCases = [
      {
        fileName: "test1.txt",
        expectedResponse: "No Action Needed",
      },
      {
        fileName: "test2.txt",
        expectedResponse: "Action Needed",
      }
    ]
    const directoryPath = path.join(__dirname, 'testTexts');
    testCases.forEach((tc) => {
      const filePath = path.join(directoryPath, tc.fileName);
      const responseText = fs.readFileSync(filePath, 'utf-8');
      const parsedResponse = parseResponse(responseText);
      expect(parsedResponse.response).toBe(tc.expectedResponse);
    })
  });

})
