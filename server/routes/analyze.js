const express = require('express');
const router = express.Router();
const { analyzeWithGranite } = require('../services/granite.service');
const { analyzeWithGemini }  = require('../services/gemini.service');

// ============================================================
// METRIC CALCULATIONS
// (mirrors the logic in src/app/products/products.ts)
// ============================================================

function getProfit(product) {
  return product.sellingPrice - product.costPrice;
}

function getSalesRate(product) {
  const total = product.stockQuantity + product.unitsSold;
  if (total === 0) return 0;
  return Math.round((product.unitsSold / total) * 100);
}

function getHealthScore(product) {
  const salesRate = getSalesRate(product);
  const profit = getProfit(product);

  let score = 50;

  if (salesRate >= 50) {
    score += 25;
  } else if (salesRate >= 25) {
    score += 15;
  } else {
    score -= 10;
  }

  if (profit > 0) {
    score += 20;
  } else {
    score -= 25;
  }

  if (product.stockQuantity <= 10) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function getHealthStatus(healthScore) {
  if (healthScore >= 75) return 'Healthy';
  if (healthScore >= 50) return 'Needs Attention';
  return 'Critical';
}

// ============================================================
// POST /api/analyze
// ============================================================

router.post('/', async (req, res) => {
  const { store, products } = req.body;

  // --- Validation ---
  if (!products) {
    return res.status(400).json({
      error: 'Missing required field: products.'
    });
  }

  if (!Array.isArray(products)) {
    return res.status(400).json({
      error: 'Field "products" must be an array.'
    });
  }

  if (products.length === 0) {
    return res.status(400).json({
      error: 'No products provided. Please add at least one product before running analysis.'
    });
  }

  // --- Pre-calculate metrics for each product (server-side) ---
  // These are passed to Granite so it has concrete numbers to reason from.
  const productsWithMetrics = products.map((product) => {
    const profit = getProfit(product);
    const salesRate = getSalesRate(product);
    const healthScore = getHealthScore(product);
    const healthStatus = getHealthStatus(healthScore);

    return {
      id: product.id,
      productName: product.productName,
      category: product.category,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      stockQuantity: Number(product.stockQuantity),
      unitsSold: Number(product.unitsSold),
      salesPeriod: product.salesPeriod || 'Last 30 Days',
      profit,
      salesRate,
      healthScore,
      healthStatus
    };
  });

  // --- Select AI provider based on AI_PROVIDER env variable ---
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  try {
    const storeContext = store || {};

    let aiResult;

    if (provider === 'granite') {
      // IBM Granite via watsonx.ai
      aiResult = await analyzeWithGranite(storeContext, productsWithMetrics);
    } else {
      // Google Gemini (default for development)
      aiResult = await analyzeWithGemini(storeContext, productsWithMetrics);
    }

    // Merge per-product AI fields onto pre-calculated metric objects
    // so the frontend always receives both numeric metrics and AI text fields
    const mergedProducts = productsWithMetrics.map((metricProduct) => {
      const aiProduct = (aiResult.products || []).find(
        (p) => String(p.id) === String(metricProduct.id) ||
               p.productName === metricProduct.productName
      );

      return {
        ...metricProduct,
        salesPerformance:  aiProduct?.salesPerformance  || '',
        profitability:     aiProduct?.profitability     || '',
        inventoryRisk:     aiProduct?.inventoryRisk     || '',
        keyProblem:        aiProduct?.keyProblem        || '',
        recommendedAction: aiProduct?.recommendedAction || ''
      };
    });

    const attentionCount = mergedProducts.filter(
      (p) => p.healthStatus !== 'Healthy'
    ).length;
    const healthyCount = mergedProducts.length - attentionCount;

    return res.status(200).json({
      analysisStatus:    `Analysis complete (${provider})`,
      productCount:      products.length,
      attentionCount,
      healthyCount,
      overallScore:      aiResult.overallScore      || 0,
      summary:           aiResult.summary           || '',
      topRecommendation: aiResult.topRecommendation || '',
      products:          mergedProducts
    });

  } catch (err) {
    console.error(`[${provider}] analysis error:`, err.message);

    // Return a graceful error the Angular frontend can display
    return res.status(500).json({
      error: err.message || `AI analysis failed (provider: ${provider}). Please check your credentials and try again.`
    });
  }
});

module.exports = router;
