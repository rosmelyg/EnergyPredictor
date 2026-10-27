// Validación y parseo de datos de entrada exclusivamente en el servidor
export const parseAndValidateData = (rawText) => {
  if (!rawText || typeof rawText !== "string" || rawText.trim() === "") {
    return {
      isValid: false,
      error: "Debe ingresar los datos históricos de consumo eléctrico.",
    };
  }

  const lines = rawText
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length !== 12) {
    return {
      isValid: false,
      error: `Debe ingresar exactamente 12 registros mensuales (mínimo y máximo 12). Actualmente ingresó ${lines.length} fila(s).`,
    };
  }

  const records = [];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length !== 2) {
      return {
        isValid: false,
        error: `Formato inválido en la fila ${i + 1} ("${lines[i]}"). Use el formato: YYYY-MM-DD, Consumo (ej. 2025-05-01, 150.35).`,
      };
    }

    const dateStr = parts[0].trim();
    const valueStr = parts[1].trim();

    // 1. Verificación de formato estricto YYYY-MM-DD
    if (!dateRegex.test(dateStr)) {
      return {
        isValid: false,
        error: `Fecha con formato inválido en la fila ${i + 1} ("${dateStr}"). Use el formato YYYY-MM-DD.`,
      };
    }

    // 2. Verificación de día real de calendario (año bisiesto, días por mes, etc.)
    const [year, month, day] = dateStr.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return {
        isValid: false,
        error: `Fecha inexistente o inválida en la fila ${i + 1} ("${dateStr}"). Verifique que corresponda a un día real de calendario.`,
      };
    }

    // 3. Verificación de consumo numérico válido >= 0
    const consumption = Number(valueStr);
    if (valueStr === "" || isNaN(consumption) || !isFinite(consumption) || consumption < 0) {
      return {
        isValid: false,
        error: `Valor de consumo inválido en la fila ${i + 1} ("${valueStr}"). Debe ser un número válido mayor o igual a 0.`,
      };
    }

    // 4. Verificación de orden cronológico ascendente (desde el mes más antiguo al más reciente)
    if (i > 0) {
      const prevDate = new Date(records[i - 1].date + "T00:00:00Z");
      if (parsedDate.getTime() <= prevDate.getTime()) {
        return {
          isValid: false,
          error: `Los registros deben estar organizados cronológicamente desde el mes más antiguo hasta el más reciente. La fecha en la fila ${i + 1} ("${dateStr}") debe ser posterior a la fecha de la fila ${i} ("${records[i - 1].date}").`,
        };
      }
    }

    records.push({
      monthIndex: i + 1,
      date: dateStr,
      consumption: consumption,
    });
  }

  return { isValid: true, records };
};

// Modo 1: Promedio Móvil Simple (SMA)
export const calculateSMA = (records) => {
  const lastThree = records.slice(-3);
  const sum = lastThree.reduce((acc, item) => acc + item.consumption, 0);
  const sma = sum / 3;
  const latestConsumption = records[records.length - 1].consumption;

  let trend = "";
  let message = "";

  if (latestConsumption > sma) {
    trend = "Alcista";
    message = `El último consumo registrado (${latestConsumption.toFixed(2)} kWh) es mayor que el promedio móvil (${sma.toFixed(2)} kWh), por lo tanto la tendencia del consumo es ALCISTA.`;
  } else if (latestConsumption < sma) {
    trend = "Bajista";
    message = `El último consumo registrado (${latestConsumption.toFixed(2)} kWh) es menor que el promedio móvil (${sma.toFixed(2)} kWh), por lo tanto la tendencia del consumo es BAJISTA.`;
  } else {
    trend = "Estable";
    message = `El último consumo registrado (${latestConsumption.toFixed(2)} kWh) es igual al promedio móvil (${sma.toFixed(2)} kWh), por lo tanto la tendencia del consumo es ESTABLE.`;
  }

  return {
    average: sma.toFixed(2),
    nextMonthPrediction: sma.toFixed(2),
    latestConsumption: latestConsumption.toFixed(2),
    trend,
    message,
  };
};

// Modo 2: Regresión Lineal (y = mx + b)
export const calculateLinearRegression = (records) => {
  const n = records.length; // 12
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = records[i].consumption;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const numeratorM = sumXY - (sumX * sumY) / n;
  const denominatorM = sumX2 - (sumX * sumX) / n;
  const m = numeratorM / denominatorM;

  const meanX = sumX / n;
  const meanY = sumY / n;
  const b = meanY - m * meanX;

  // Predicción mes 13: y = m(13) + b
  const predictionMonth13 = m * 13 + b;

  let trend = "";
  let message = "";

  if (m > 0) {
    trend = "Alcista";
    message = "La pendiente es mayor que 0, lo que indica una tendencia alcista en el consumo eléctrico.";
  } else if (m < 0) {
    trend = "Bajista";
    message = "La pendiente es menor que 0, lo que indica una tendencia bajista en el consumo eléctrico.";
  } else {
    trend = "Estable";
    message = "La pendiente es igual a 0, lo que indica una tendencia estable en el consumo eléctrico.";
  }

  return {
    predictionMonth13: predictionMonth13.toFixed(2),
    slope: m.toFixed(4),
    intercept: b.toFixed(4),
    trend,
    message,
  };
};

// Modo 3: Variación Porcentual
export const calculatePercentageVariation = (records) => {
  const monthlyVariations = [];
  const validVariations = [];

  monthlyVariations.push({
    monthLabel: `Mes 1 (${records[0].date})`,
    variationText: "n/a",
  });

  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1].consumption;
    const current = records[i].consumption;

    if (previous === 0) {
      monthlyVariations.push({
        monthLabel: `Mes ${i + 1} (${records[i].date})`,
        variationText: "La variación no puede ser calculada para este periodo (consumo anterior igual a 0)",
      });
    } else {
      const variation = ((current - previous) / previous) * 100;
      validVariations.push(variation);
      monthlyVariations.push({
        monthLabel: `Mes ${i + 1} (${records[i].date})`,
        variationText: `${variation >= 0 ? "+" : ""}${variation.toFixed(2)}%`,
      });
    }
  }

  const avgVariation =
    validVariations.length > 0
      ? validVariations.reduce((acc, v) => acc + v, 0) / validVariations.length
      : 0;

  let trendMessage = "";
  if (avgVariation > 1) {
    trendMessage = "El promedio de variación porcentual es mayor a 1%: el consumo general está AUMENTANDO.";
  } else if (avgVariation < -1) {
    trendMessage = "El promedio de variación porcentual es menor a -1%: el consumo general está DISMINUYENDO.";
  } else {
    trendMessage = "El promedio de variación porcentual se encuentra entre -1% y 1%: el consumo general permanece ESTABLE.";
  }

  return {
    monthlyVariations,
    averageVariation: `${avgVariation.toFixed(2)}%`,
    message: trendMessage,
  };
};

// Modo 4: Detección de Tendencia
export const calculateTrendDetection = (records) => {
  let increases = 0;
  let decreases = 0;
  let stables = 0;
  const details = [];

  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1].consumption;
    const curr = records[i].consumption;

    if (curr > prev) {
      increases++;
      details.push(`${prev} → ${curr} (sube)`);
    } else if (curr < prev) {
      decreases++;
      details.push(`${prev} → ${curr} (baja)`);
    } else {
      stables++;
      details.push(`${prev} → ${curr} (estable)`);
    }
  }

  let generalTrend = "";
  // Reglas explícitas según la guía funcional
  if (increases > decreases && increases > stables) {
    generalTrend = "Tendencia Alcista (la mayoría de los meses aumenta)";
  } else if (decreases > increases && decreases > stables) {
    generalTrend = "Tendencia Bajista (la mayoría de los meses disminuye)";
  } else if (stables > increases && stables > decreases) {
    generalTrend = "Tendencia Estable (la mayoría de los meses permanecen estables)";
  } else if (increases === decreases && decreases === stables) {
    generalTrend = "Tendencia Estable (empate entre todas las categorías: alcista, bajista y estable)";
  } else if (increases === decreases && increases > stables) {
    generalTrend = "Tendencia Estable (empate entre meses que subieron y bajaron)";
  } else if (increases === stables && increases > decreases) {
    generalTrend = "Tendencia Estable (empate entre meses que subieron y estables)";
  } else if (decreases === stables && decreases > increases) {
    generalTrend = "Tendencia Estable (empate entre meses que bajaron y estables)";
  } else {
    generalTrend = "Tendencia Estable";
  }

  return {
    increases,
    decreases,
    stables,
    details,
    generalTrend,
  };
};
