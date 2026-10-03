import { createApp } from "./app.ts";
import { resolveCatalogFromEnv } from "./catalog.ts";
import { loadEnvFile } from "./load-env.ts";

loadEnvFile();

const port = Number(process.env.PORT) || 3001;
const catalog = resolveCatalogFromEnv();
const app = createApp(catalog);

app.listen(port, () => {
  console.log(`Watcher API http://127.0.0.1:${port}`);
});
