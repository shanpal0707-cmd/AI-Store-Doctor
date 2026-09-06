const express = require('express');
const router = express.Router();

const {
  callGemini,
  parseJson
} = require('../services/gemini.service');

// ============================================================
// PROMPT BUILDER
// ============================================================

function buildContentPrompt(
  store,
  product,
  contentType,
  marketingGoal
) {
  const storeCtx = [
    `Store name: ${store.storeName || 'My Store'}`,
    `Business type: ${store.businessType || 'Retail'}`,
    `Store size: ${store.storeSize || 'Unknown'}`,
    `Primary goal: ${store.primaryGoal || 'Grow the business'}`
  ].join('\n');

  const profit =
    Number(product.sellingPrice) -
    Number(product.costPrice);

  const total =
    Number(product.stockQuantity) +
    Number(product.unitsSold);

  const salesRate =
    total > 0
      ? Math.round(
          (Number(product.unitsSold) / total) * 100
        )
      : 0;

  const productCtx = [
    `Product name: ${product.productName}`,
    `Category: ${product.category}`,
    `Selling price: ₹${product.sellingPrice}`,
    `Cost price: ₹${product.costPrice}`,
    `Profit per unit: ₹${profit}`,
    `Stock in hand: ${product.stockQuantity} units`,
    `Units sold: ${product.unitsSold} (${product.salesPeriod || 'Last 30 Days'})`,
    `Sales rate: ${salesRate}%`
  ].join('\n');

  return `You are an expert retail marketing copywriter. Create marketing content for a retail store owner.

Store context:
${storeCtx}

Product details:
${productCtx}

Content type requested: ${contentType}
Marketing goal: ${marketingGoal}

Return ONLY a valid JSON object.
Do not use markdown fences.
Do not add any text outside the JSON.

Use exactly this structure:

{
  "generatedContent": "<the main marketing content — the actual caption, description, or message ready to use>",
  "suggestedHeadline": "<a short punchy headline for this content>",
  "callToAction": "<a specific, actionable call-to-action phrase>",
  "marketingTips": [
    "<practical tip 1 for distributing or improving this content>",
    "<practical tip 2>",
    "<practical tip 3>"
  ],
  "hashtags": [
    "<hashtag1>",
    "<hashtag2>",
    "<hashtag3>",
    "<hashtag4>",
    "<hashtag5>"
  ]
}`;
}

// ============================================================
// POST /api/content
// ============================================================

router.post('/', async (req, res) => {
  const {
    store,
    product,
    contentType,
    marketingGoal
  } = req.body;

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------

  if (!product || !product.productName) {
    return res.status(400).json({
      error: 'Missing required field: product.'
    });
  }

  if (!contentType) {
    return res.status(400).json({
      error: 'Missing required field: contentType.'
    });
  }

  const goal =
    marketingGoal || 'Increase Sales';

  try {
    const prompt = buildContentPrompt(
      store || {},
      product,
      contentType,
      goal
    );

    const rawText = await callGemini(
      prompt,
      {
        temperature: 0.7,
        maxOutputTokens: 4096
      }
    );

    const result = parseJson(rawText);

    return res.status(200).json({
      status:
        'Content generated successfully',

      productName:
        product.productName,

      contentType,

      marketingGoal:
        goal,

      generatedContent:
        result.generatedContent || '',

      suggestedHeadline:
        result.suggestedHeadline || '',

      callToAction:
        result.callToAction || '',

      marketingTips:
        Array.isArray(result.marketingTips)
          ? result.marketingTips
          : [],

      hashtags:
        Array.isArray(result.hashtags)
          ? result.hashtags
          : []
    });

  } catch (err) {
    console.error(
      '[content] error:',
      err.message
    );

    return res.status(500).json({
      error:
        err.message ||
        'Content generation failed. Please check your credentials and try again.'
    });
  }
});

module.exports = router;