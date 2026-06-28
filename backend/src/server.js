import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`CUBO API escuchando en http://localhost:${env.port}`);
});
