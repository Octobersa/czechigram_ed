const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const password = 'securePassword123'; // Use a strong password or env variable
  const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

  // Create User 1
  const user1 = await prisma.user.upsert({
    where: { email: 'seeduser1@example.com' },
    update: {}, // No updates needed if user exists
    create: {
      email: 'seeduser1@example.com',
      name: 'Seed User One',
      password: hashedPassword,
      bio: 'This is the first seeded user.',
    },
  });
  console.log(`Created/found user: ${user1.name}`);

  // Create User 2
  const user2 = await prisma.user.upsert({
    where: { email: 'seeduser2@example.com' },
    update: {},
    create: {
      email: 'seeduser2@example.com',
      name: 'Seed User Two',
      password: hashedPassword, // Can use the same hash for simplicity in seed
      bio: 'This is the second seeded user.',
      role: 'admin',
    },
  });
  console.log(`Created/found user: ${user2.name}`);

  // Create Photo 1 for User 1
  // Check if user1 already has a photo to make seeding idempotent
  const existingPhoto = await prisma.photo.findFirst({
    where: {
      userId: user1.id,
    },
  });

  if (!existingPhoto) {
    const photo1 = await prisma.photo.create({
      data: {
        userId: user1.id, // Link photo to User 1
        imageUrl: 'https://picsum.photos/seed/seed1/800/600', // Placeholder image URL
        description: 'A beautiful landscape seeded for User One.',
      },
    });
    console.log(`Created photo with ID: ${photo1.id} for user ${user1.name}`);
  } else {
    console.log(`Photo for user ${user1.name} already exists, skipping creation.`);
  }

  const existingPhotoUser2 = await prisma.photo.findFirst({
    where: {
      userId: user2.id,
    },
  });

  if (!existingPhotoUser2) {
    const photo1 = await prisma.photo.create({
      data: {
        userId: user2.id, // Link photo to User 1
        imageUrl: 'https://picsum.photos/seed/seed2/800/600', // Placeholder image URL
        description: null,
      },
    });
    console.log(`Created photo with ID: ${photo1.id} for user ${user1.name}`);
  } else {
    console.log(`Photo for user ${user1.name} already exists, skipping creation.`);
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Ensure Prisma Client disconnects
    await prisma.$disconnect();
  });
