/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import path from 'path';
import url from 'node:url';
import { test, expect } from './fixtures.js';

type ComplianceRule = { path: string; text: string };

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rulesPath = path.join(__dirname, '../compliance/rules.json');
const rules: { rules: ComplianceRule[] } = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

for (const rule of rules.rules) {
  test(`compliance check for ${rule.path}`, async ({ client, server }) => {
    const url = new URL(rule.path, server.PREFIX).toString();
    const result = await client.callTool({
      name: 'browser_navigate',
      arguments: { url }
    });
    expect(result).toContainTextContent(rule.text);
  });
}
