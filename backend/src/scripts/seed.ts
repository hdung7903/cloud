import { prisma } from "../lib/prisma.js";

async function main() {
  const roles = [
    { name: "admin", description: "Full access" },
    { name: "manager", description: "Manage shares and folders" },
    { name: "member", description: "Standard user" },
    { name: "viewer", description: "Read-only" },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }
  console.log("Seeded roles");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

