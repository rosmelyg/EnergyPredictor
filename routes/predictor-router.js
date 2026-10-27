import express from "express";
import {
  parseAndValidateData,
  calculateSMA,
  calculateLinearRegression,
  calculatePercentageVariation,
  calculateTrendDetection,
} from "../utils/predictor-logic.js";

const router = express.Router();

// example data for the textarea
const sampleData = `2025-01-01, 300.00
2025-02-01, 315.00
2025-03-01, 320.00
2025-04-01, 310.00
2025-05-01, 325.50
2025-06-01, 330.00
2025-07-01, 330.00
2025-08-01, 340.25
2025-09-01, 335.00
2025-10-01, 320.00
2025-11-01, 340.00
2025-12-01, 360.00`;

// Get the home page with the form
router.get("/", (req, res) => {
  res.status(200).render("index", {
    layout: false,
    pageTitle: "Predictor de Consumo Eléctrico del Hogar",
    selectedMode: "sma",
    rawData: sampleData,
  });
});

// post for process the 12 months data and return the prediction
router.post("/predict", (req, res) => {
  const { historicalData, predictionMode } = req.body;
  const selectedMode = predictionMode || "sma";

  const validation = parseAndValidateData(historicalData);

  if (!validation.isValid) {
    return res.status(400).render("index", {
      layout: false,
      pageTitle: "Predictor de Consumo Eléctrico del Hogar",
      selectedMode,
      rawData: historicalData,
      hasError: true,
      errorMessage: validation.error,
    });
  }

  const records = validation.records;
  let resultData = {};

  switch (selectedMode) {
    case "sma":
      resultData = calculateSMA(records);
      break;
    case "linear":
      resultData = calculateLinearRegression(records);
      break;
    case "variation":
      resultData = calculatePercentageVariation(records);
      break;
    case "trend":
      resultData = calculateTrendDetection(records);
      break;
    default:
      resultData = calculateSMA(records);
      break;
  }

  res.status(200).render("index", {
    layout: false,
    pageTitle: "Predictor de Consumo Eléctrico del Hogar",
    selectedMode,
    rawData: historicalData,
    hasResult: true,
    result: resultData,
    records,
  });
});

export default router;