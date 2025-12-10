import { env } from "./config.js";
import { createApp } from "./app.js";

const app = createApp();
const port = env.PORT;

app.listen(port, () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
});

