import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { projectRoot } from "./utils/path.js";
import predictorRouter from "./routes/predictor-router.js";
import { equals } from "./utils/helpers/hbs/compare.js";

const app = express();

//  handlebars engine setup
app.engine(
  "hbs",
  engine({
    helpers: {
      equals: equals,
    },
  })
);
app.set("view engine", "hbs");
app.set("views", "views");

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(projectRoot, "public")));

// Rutas
app.use(predictorRouter);

// Middleware 404
app.use((req, res) => {
  res.status(404).render("404", {
    layout: false,
    pageTitle: "404 - Página no encontrada",
  });
});

app.listen(8080, () => {
  console.log("Servidor ejecutándose en http://localhost:8080");
});