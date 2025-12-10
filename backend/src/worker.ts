import dotenv from "dotenv";

dotenv.config();

// TODO: add cron/scheduler for expired shares, orphan cleanup, soft-delete purge.
async function main() {
  console.log("Worker started. Implement cleanup jobs here.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

