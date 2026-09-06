const axios = require('axios');

// ============================================================
// COMMON GEMINI CONFIG
// ============================================================

const MODEL = 'gemini-3.6-flash';

function getGeminiUrl() {
  return `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
}

// ============================================================
// GEMINI API CALL
// ============================================================

async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Add GEMINI_API_KEY to server/.env'
    );
  }

  const temperature =
    typeof options.temperature === 'number'
      ? options.temperature
      : 0.2;

  const maxOutputTokens =
    Number(options.maxOutputTokens) > 0
      ? Number(options.maxOutputTokens)
      : 8192;

  const body = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature,
      maxOutputTokens
    }
  };

  console.log('[gemini] sending request...');
  console.log('[gemini] model:', MODEL);
  console.log('[gemini] maxOutputTokens:', maxOutputTokens);

  let response;

  try {
    response = await axios.post(
      getGeminiUrl(),
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        timeout: 120000
      }
    );
  } catch (err) {
    const status = err.response?.status;
    const apiError =
      err.response?.data?.error ||
      err.response?.data;

    console.error(
      '[gemini] HTTP error:',
      status || err.message
    );

    if (apiError) {
      console.error(
        '[gemini] API response:',
        JSON.stringify(apiError, null, 2)
      );
    }

    if (status === 429) {
      throw new Error(
        'Gemini API rate limit reached. Please try again shortly.'
      );
    }

    throw new Error(
      apiError?.message ||
      `Gemini request failed${status ? ` with status ${status}` : ''}.`
    );
  }

  const candidate = response.data?.candidates?.[0];

  if (!candidate) {
    console.error(
      '[gemini] No candidate returned:',
      JSON.stringify(response.data, null, 2)
    );

    throw new Error('Gemini returned no response candidate.');
  }

  const finishReason = candidate.finishReason || 'UNKNOWN';

  console.log('[gemini] HTTP status:', response.status);
  console.log('[gemini] finishReason:', finishReason);

  // ----------------------------------------------------------
  // IMPORTANT:
  // Detect truncation BEFORE trying to parse JSON.
  // ----------------------------------------------------------

  if (finishReason === 'MAX_TOKENS') {
    throw new Error(
      'Gemini response was truncated because it reached the output token limit.'
    );
  }

  if (finishReason === 'SAFETY') {
    throw new Error(
      'Gemini blocked the response for safety reasons.'
    );
  }

  if (finishReason === 'RECITATION') {
    throw new Error(
      'Gemini stopped the response because of a recitation issue.'
    );
  }

  const parts = candidate.content?.parts;

  if (!Array.isArray(parts) || parts.length === 0) {
    console.error(
      '[gemini] Missing response parts:',
      JSON.stringify(response.data, null, 2)
    );

    throw new Error('Gemini returned an empty response.');
  }

  const text = parts
    .map(part => part?.text || '')
    .join('')
    .trim();

  if (!text) {
    console.error(
      '[gemini] Empty Gemini text:',
      JSON.stringify(response.data, null, 2)
    );

    throw new Error('Gemini returned an empty response.');
  }

  console.log('[gemini] response received successfully.');
  console.log('[gemini] raw response length:', text.length);

  return text;
}

// ============================================================
// ROBUST JSON EXTRACTION
// ============================================================

function extractJsonObject(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Gemini returned an empty or invalid response.');
  }

  let cleaned = text.trim();

  // ----------------------------------------------------------
  // Remove markdown fences
  // ----------------------------------------------------------

  cleaned = cleaned
    .replace(/^\uFEFF/, '')
    .replace(/^```json[\r\n]*/i, '')
    .replace(/^```[\r\n]*/i, '')
    .replace(/[\r\n]*```\s*$/i, '')
    .trim();

  // ----------------------------------------------------------
  // Find first JSON object
  // ----------------------------------------------------------

  const start = cleaned.indexOf('{');

  if (start === -1) {
    console.error(
      '[gemini] No opening JSON object found.'
    );

    console.error(
      '[gemini] cleaned response:',
      cleaned.substring(0, 1000)
    );

    throw new Error(
      'Gemini did not return a valid JSON block.'
    );
  }

  // ----------------------------------------------------------
  // Bracket-depth scanner
  //
  // Handles:
  // - nested objects
  // - arrays
  // - braces inside strings
  // - escaped quotes
  // - extra text after JSON
  // ----------------------------------------------------------

  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let end = -1;

  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inString && ch === '\\') {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (ch === '{') {
      depth++;
      continue;
    }

    if (ch === '}') {
      depth--;

      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1 || depth !== 0) {
    console.error(
      '[gemini] JSON object appears incomplete or truncated.'
    );

    console.error(
      '[gemini] cleaned response (first 1500 chars):',
      cleaned.substring(0, 1500)
    );

    throw new Error(
      'Gemini returned incomplete JSON. The response may have been truncated.'
    );
  }

  return cleaned.slice(start, end + 1);
}

// ============================================================
// PUBLIC JSON PARSER
// ============================================================

function parseJson(text, options = {}) {
  console.log(
    '[gemini] parsing response...'
  );

  console.log(
    '[gemini] input length:',
    text?.length || 0
  );

  const jsonText = extractJsonObject(text);

  console.log(
    '[gemini] extracted JSON length:',
    jsonText.length
  );

  try {
    const parsed = JSON.parse(jsonText);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        'Gemini response is not a JSON object.'
      );
    }

    console.log(
      '[gemini] JSON parse successful.'
    );

    return parsed;

  } catch (err) {
    console.error(
      '[gemini] JSON.parse failed:',
      err.message
    );

    console.error(
      '[gemini] failing JSON (first 1500 chars):',
      jsonText.substring(0, 1500)
    );

    throw new Error(
      'Gemini response could not be parsed as JSON.'
    );
  }
}

// ============================================================
// PRODUCT DOCTOR PROMPT
// ============================================================

function buildPrompt(store, products) {
  const storeContext = [
    `Store name: ${store.storeName || store.name || 'Unknown'}`,
    `Business type: ${store.businessType || 'Retail'}`,
    `Store size: ${store.storeSize || 'Unknown'}`,
    `Primary goal: ${store.primaryGoal || 'Grow the business'}`
  ].join('\n');

  const productLines = products.map((p, i) => {
    const marginPct =
      p.sellingPrice > 0
        ? Math.round(
            ((p.sellingPrice - p.costPrice) /
              p.sellingPrice) *
              100
          )
        : 0;

    return [
      `Product ${i + 1}:`,
      `id: ${p.id}`,
      `Name: ${p.productName}`,
      `Category: ${p.category}`,
      `Cost price: ₹${p.costPrice}`,
      `Selling price: ₹${p.sellingPrice}`,
      `Profit per unit: ₹${p.profit} (${marginPct}% margin)`,
      `Stock quantity: ${p.stockQuantity} units`,
      `Units sold: ${p.unitsSold} (${p.salesPeriod})`,
      `Sales rate: ${p.salesRate}%`,
      `Health score: ${p.healthScore}/100`,
      `Health status: ${p.healthStatus}`
    ].join('\n');
  }).join('\n\n');

  return `You are a retail business analyst. A store owner needs your help understanding their product performance.

Store context:
${storeContext}

Products with pre-calculated metrics:
${productLines}

Return ONLY a valid JSON object.
Do not use markdown fences.
Do not add explanations outside the JSON.

Use exactly this structure:

{
  "overallScore": <integer 0-100>,
  "summary": "<2-3 sentence overview of the store's overall product performance>",
  "topRecommendation": "<single most important action the store owner should take right now>",
  "products": [
    {
      "id": <numeric id>,
      "productName": "<product name>",
      "healthStatus": "<Healthy | Needs Attention | Critical>",
      "healthScore": <integer 0-100>,
      "salesPerformance": "<one sentence interpreting sales>",
      "profitability": "<one sentence on profit margin and pricing>",
      "inventoryRisk": "<one sentence on stock level risk>",
      "keyProblem": "<one sentence identifying the main issue>",
      "recommendedAction": "<one specific practical action>"
    }
  ]
}`;
}

// ============================================================
// PRODUCT DOCTOR
// ============================================================

async function analyzeWithGemini(store, productsWithMetrics) {
  const prompt = buildPrompt(
    store,
    productsWithMetrics
  );

  const rawText = await callGemini(
    prompt,
    {
      temperature: 0.2,
      maxOutputTokens: 8192
    }
  );

  const result = parseJson(rawText);

  if (
    !Array.isArray(result.products)
  ) {
    console.error(
      '[gemini] Parsed response does not contain products array.'
    );

    throw new Error(
      'Gemini response is missing the products array.'
    );
  }

  console.log(
    '[gemini] Product Doctor parse successful — products:',
    result.products.length
  );

  return result;
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  callGemini,
  parseJson,
  analyzeWithGemini
};