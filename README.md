# ⚡ EnergyPredictor - Predictor de Consumo Eléctrico del Hogar

**EnergyPredictor** es una aplicación web desarrollada con **Node.js**, **Express.js (v5)** y el motor de plantillas **Handlebars (HBS)** que permite analizar el comportamiento histórico del consumo energético de una vivienda y proyectar el consumo futuro en kilovatios-hora (**kWh**).

A partir de una serie histórica de **12 registros mensuales** ordenados cronológicamente, el sistema procesa y valida toda la lógica de negocio exclusivamente del lado del servidor (*Server-Side Rendering*), ofreciendo cuatro métodos de análisis matemático y estadístico:

1. **Promedio Móvil Simple (SMA):** Estima el consumo del mes siguiente (Mes 13) promediando los últimos 3 periodos y evalúa si la tendencia actual es alcista, bajista o estable.
2. **Regresión Lineal ($y = mx + b$):** Ajusta una recta de tendencia sobre los 12 meses para proyectar el consumo del mes 13, calculando la pendiente ($m$) y el intercepto ($b$).
3. **Variación Porcentual:** Calcula el porcentaje de cambio mes a mes, el promedio general de variación y determina si el consumo está aumentando, disminuyendo o permanece estable.
4. **Detección de Tendencia:** Analiza secuencialmente los incrementos, disminuciones y meses estables para identificar el patrón predominante del hogar.