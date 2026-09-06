const axios = require('axios');

// ============================================================
// IBM IAM TOKEN CACHE
// Tokens are valid for 60 min — we refresh at 55 min.
// ============================================================

let cachedToken = null;
let tokenExpiresAt = 0;

async function getIAMToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const apiKey = process.env.IBM_API_KEY;

  if (!apiKey || apiKey === 'your_ibm_api_key_here') {
    throw new Error(
      'IBM_API_KEY is not configured. ' +
      'Copy server/.env.example to server/.env and fill in your IBM API key.'
    );
  }

  const response = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
  );

  cachedToken = response.data.access_token;
  // Cache for 55 minutes (tokens expire at 60)
  tokenExpiresAt = now + 55 * 60 * 1000;

  return cachedToken;
}

// ============================================================
// PROMPT BUILDER
// Products already have pre-calculated metrics injected by
// routes/analyze.js before this service is called.
// ============================================================

function buildPrompt(store, products) {
  const storeContext = [
    `Store name: ${store.name || 'Unknown'}`,
    `Business type: ${store.businessType || 'Retail'}`,
    `Store size: ${store.storeSize || 'Unknown'}`,
    `Primary goal: ${store.primaryGoal || 'Grow the business'}`
  ].join('\n');

  const productLines = products.map((p, i) => {
    const marginPct =
      p.sellingPrice > 0
        ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
        : 0;

    return [
      `Product ${i + 1}:`,
      `  Name: ${p.productName}`,
      `  Category: ${p.category}`,
      `  Cost price: $${p.costPrice}`,
      `  Selling price: $${p.sellingPrice}`,
      `  Profit per unit: $${p.profit} (${marginPct}% margin)`,
      `  Stock quantity: ${p.stockQuantity} units`,
      `  Units sold: ${p.unitsSold} (${p.salesPeriod})`,
      `  Sales rate: ${p.salesRate}% sell-through`,
      `  Health score: ${p.healthScore}/100`,
      `  Health status: ${p.healthStatus}`
    ].join('\n');
  }).join('\n\n');

  return `You are a retail business analyst. A store owner needs your help understanding their product performance.

Store context:
${storeContext}

Products with calculated metrics:
${productLines}

Analyze each product and return ONLY a valid JSON object with this exact structure. No explanation, no markdown, no text before or after the JSON:

{
  "overallScore": <integer 0-100, weighted average health across all products>,
  "summary": "<2-3 sentence overview of the store's overall product performance>",
  "topRecommendation": "<single most important action the store owner should take right now>",
  "products": [
    {
      "id": <copy the product id from input, use index if no id>,
      "productName": "<copy from input>",
      "healthStatus": "<Healthy | Needs Attention | Critical>",
      "healthScore": <integer 0-100>,
      "salesPerformance": "<one sentence interpreting the sales rate and units sold>",
      "profitability": "<one sentence on profit margin and pricing>",
      "inventoryRisk": "<one sentence on stock level risk>",
      "keyProblem": "<one sentence identifying the main issue, or 'No major issues identified.' if healthy>",
      "recommendedAction": "<one specific, practical action the owner can take>"
    }
  ]
}`;
}

// ============================================================
// CALL IBM GRANITE VIA watsonx.ai REST API
// ============================================================

async function callGranite(prompt) {
  const token = await getIAMToken();

  const projectId = process.env.IBM_PROJECT_ID;
  const region = process.env.IBM_REGION || 'us-south';

  if (!projectId || projectId === 'your_project_id_here') {
    throw new Error(
      'IBM_PROJECT_ID is not configured. ' +
      'Copy server/.env.example to server/.env and fill in your watsonx.ai Project ID.'
    );
  }

  const url =
    `https://${region}.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29`;

  const body = {
    model_id: 'ibm/granite-13b-instruct-v2',
    input: prompt,
    parameters: {
      decoding_method: 'greedy',
      max_new_tokens: 1500,
      repetition_penalty: 1.1
    },
    project_id: projectId
  };

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.results[0].generated_text;
}

// ============================================================
// PARSE GRANITE RESPONSE
// Granite may wrap the JSON in extra text — we extract it.
// ============================================================

function parseGraniteResponse(text, fallbackProducts) {
  // Find the first { and last } to extract the JSON block
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('IBM Granite did not return a valid JSON block.');
  }

  const jsonText = text.slice(start, end + 1);

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('IBM Granite response could not be parsed as JSON.');
  }

  // Ensure products array is present and matches input count
  if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
    throw new Error('IBM Granite response is missing the products array.');
  }

  return parsed;
}

// ============================================================
// PUBLIC API — called from routes/analyze.js
// ============================================================

async function analyzeWithGranite(store, productsWithMetrics) {
  const prompt = buildPrompt(store, productsWithMetrics);
  const rawText = await callGranite(prompt);
  const result = parseGraniteResponse(rawText, productsWithMetrics);
  return result;
}

module.exports = { analyzeWithGranite };
