const express = require('express');
const router = express.Router();

const {
  callGemini,
  parseJson
} = require('../services/gemini.service');

// ============================================================
// PROMPT BUILDER
// ============================================================

function buildMarketPrompt(
  store,
  products
) {
  const storeCtx = [
    `Store name: ${store.storeName || store.name || 'My Store'}`,
    `Business type: ${store.businessType || 'Retail'}`,
    `Store size: ${store.storeSize || 'Unknown'}`,
    `Primary goal: ${store.primaryGoal || 'Grow the business'}`
  ].join('\n');

  const productLines = products
    .map((p, i) => {
      const profit =
        Number(p.sellingPrice) -
        Number(p.costPrice);

      const total =
        Number(p.stockQuantity) +
        Number(p.unitsSold);

      const salesRate =
        total > 0
          ? Math.round(
              (Number(p.unitsSold) / total) * 100
            )
          : 0;

      return [
        `Product ${i + 1}:`,
        `  Name: ${p.productName}`,
        `  Category: ${p.category}`,
        `  Selling price: ₹${p.sellingPrice}`,
        `  Cost price: ₹${p.costPrice}`,
        `  Profit per unit: ₹${profit}`,
        `  Stock quantity: ${p.stockQuantity}`,
        `  Units sold: ${p.unitsSold} (${p.salesPeriod || 'Last 30 Days'})`,
        `  Sales rate: ${salesRate}%`
      ].join('\n');
    })
    .join('\n\n');

  return `You are a retail market intelligence analyst. A store owner wants to understand the market opportunities for their store based on their current product portfolio.

Store context:
${storeCtx}

Current product portfolio:
${productLines}

Analyze the store's product portfolio and return ONLY a valid JSON object.
Do not use markdown fences.
Do not add any text outside the JSON.

Use exactly this structure:

{
  "marketScore": <integer 0-100 representing overall market opportunity score>,
  "marketOverview": "<2-3 sentence overview of the store's market position and key opportunities>",
  "topOpportunity": "<single most important market opportunity the store owner should act on>",
  "seasonalInsight": "<one sentence about current or upcoming seasonal trends relevant to this store's products>",
  "demandSignals": [
    "<demand signal or trend observation 1>",
    "<demand signal or trend observation 2>",
    "<demand signal or trend observation 3>",
    "<demand signal or trend observation 4>"
  ],
  "trendingProducts": [
    {
      "productName": "<name of product from portfolio>",
      "category": "<product category>",
      "demandSignal": "<one sentence on why this product has strong demand potential>",
      "opportunity": "<one specific action to capitalise on this demand>"
    }
  ],
  "pricingOpportunities": [
    {
      "productName": "<name of product from portfolio>",
      "currentPrice": <current selling price as number>,
      "suggestion": "<one sentence pricing recommendation>",
      "potentialImpact": "<one sentence on the expected business impact>"
    }
  ],
  "categoryOpportunities": [
    {
      "category": "<product category name>",
      "insight": "<one sentence market insight for this category>",
      "recommendation": "<one specific action to improve performance in this category>"
    }
  ],
  "aiRecommendations": [
    "<prioritised recommendation 1>",
    "<prioritised recommendation 2>",
    "<prioritised recommendation 3>"
  ]
}`;
}

// ============================================================
// POST /api/market-intelligence
// ============================================================

router.post('/', async (req, res) => {
  const {
    store,
    products
  } = req.body;

  if (
    !products ||
    !Array.isArray(products)
  ) {
    return res.status(400).json({
      error:
        'Field "products" must be a non-empty array.'
    });
  }

  if (products.length === 0) {
    return res.status(400).json({
      error:
        'No products provided. Please add at least one product before running Market Intelligence.'
    });
  }

  try {
    const prompt =
      buildMarketPrompt(
        store || {},
        products
      );

    const rawText =
      await callGemini(
        prompt,
        {
          temperature: 0.5,
          maxOutputTokens: 8192
        }
      );

    const result =
      parseJson(rawText);

    return res.status(200).json({
      status:
        'Market intelligence generated successfully',

      productCount:
        products.length,

      marketScore:
        Number(result.marketScore) || 0,

      marketOverview:
        result.marketOverview || '',

      topOpportunity:
        result.topOpportunity || '',

      seasonalInsight:
        result.seasonalInsight || '',

      demandSignals:
        Array.isArray(result.demandSignals)
          ? result.demandSignals
          : [],

      trendingProducts:
        Array.isArray(result.trendingProducts)
          ? result.trendingProducts
          : [],

      pricingOpportunities:
        Array.isArray(result.pricingOpportunities)
          ? result.pricingOpportunities
          : [],

      categoryOpportunities:
        Array.isArray(result.categoryOpportunities)
          ? result.categoryOpportunities
          : [],

      aiRecommendations:
        Array.isArray(result.aiRecommendations)
          ? result.aiRecommendations
          : []
    });

  } catch (err) {
    console.error(
      '[market] error:',
      err.message
    );

    return res.status(500).json({
      error:
        err.message ||
        'Market intelligence generation failed. Please check your credentials and try again.'
    });
  }
});

module.exports = router;