import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const project = await db.project.create({
    data: {
      name: 'Demo Project',
      description: 'A sample project for getting started',
    },
  });

  await db.prompt.create({
    data: {
      name: 'Hello World Prompt',
      content: 'Say hello to the user in a friendly tone.',
      description: 'A simple greeting prompt',
      tags: ['demo', 'greeting'],
      isPublic: true,
      projectId: project.id,
      versions: {
        create: { content: 'Say hello to the user in a friendly tone.', version: 1 },
      },
    },
  });

  console.log('✅ Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
