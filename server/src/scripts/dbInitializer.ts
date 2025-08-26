import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');

   // Create admin user if not exists
    const adminEmail = 'user@admin.com';
    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    let admin;
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('adminUser123!', 10);
      admin = await prisma.user.create({
        data: {
          fname: 'Admin',
          lname: 'User',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          address: '124 Admin St, Nyabihu, Rwanda',
          isVerified: true,
        },
      });
      // Set location using raw SQL
      await prisma.$executeRaw`
        UPDATE "User"
        SET location = ST_SetSRID(ST_MakePoint(${29.4577}, ${-1.6868}), 4326)
        WHERE id = ${admin.id}
      `;
      console.log('Admin user created');
    } else {
      admin = adminExists;
    }

    // Create donor user if not exists
    const donorEmail = 'user@donor.com';
    const donorExists = await prisma.user.findUnique({ where: { email: donorEmail } });
    let donor;
    if (!donorExists) {
      const hashedPassword = await bcrypt.hash('donorSheja123!', 10);
      donor = await prisma.user.create({
        data: {
          fname: 'Sheja',
          lname: 'User',
          email: donorEmail,
          password: hashedPassword,
          role: 'DONOR',
          address: '124 Admin St, Nyabihu, Rwanda',
          isVerified: true,
        },
      });
      // Set location using raw SQL
      await prisma.$executeRaw`
        UPDATE "User"
        SET location = ST_SetSRID(ST_MakePoint(${29.4577}, ${-1.6868}), 4326)
        WHERE id = ${donor.id}
      `;
      console.log('Donor user created');
    } else {
      donor = donorExists;
    }

    // Create acceptor user if not exists
    const acceptorEmail = 'user@acceptor.com';
    const acceptorExists = await prisma.user.findUnique({ where: { email: acceptorEmail } });
    let acceptor;
    if (!acceptorExists) {
      const hashedPassword = await bcrypt.hash('acceptorAkuzwe123!', 10);
      acceptor = await prisma.user.create({
        data: {
          fname: 'Akuzwe',
          lname: 'Org',
          email: acceptorEmail,
          password: hashedPassword,
          role: 'ACCEPTOR',
          address: '121 Admin St, Nyabihu, Rwanda',
          isVerified: true,
          orgDocuments: '/uploads/community_center_docs.pdf',
        },
      });
      // Set location using raw SQL
      await prisma.$executeRaw`
        UPDATE "User"
        SET location = ST_SetSRID(ST_MakePoint(${29.4600}, ${-1.6890}), 4326)
        WHERE id = ${acceptor.id}
      `;
      console.log('Acceptor user created');
    } else {
      acceptor = acceptorExists;
    }

    // Seed sample listings
    if (donor) {
      const listingsExist = await prisma.listing.count({ where: { userId: donor.id } });
      if (listingsExist === 0) {
        // Create listings without location
        const createdListings = await prisma.listing.createMany({
          data: [
            {
              userId: donor.id,
              title: 'Gently Used Dining Chairs',
              description: 'Set of 4 wooden chairs, good condition, pickup only.',
              category: 'FURNITURE',
              status: 'ACTIVE',
            },
            {
              userId: donor.id,
              title: 'Children\'s Books',
              description: 'Collection of 10 children\'s storybooks, ages 3-8.',
              category: 'BOOKS',
              status: 'ACTIVE',
            },
          ],
        });
        // Set location for each listing using raw SQL
        const listings = await prisma.listing.findMany({ where: { userId: donor.id } });
        if (listings.length > 0) {
          await prisma.$executeRaw`
            UPDATE "Listing"
            SET location = ST_SetSRID(ST_MakePoint(${29.4577}, ${-1.6868}), 4326)
            WHERE id = ${listings[0].id}
          `;
        }
        if (listings.length > 1) {
          await prisma.$executeRaw`
            UPDATE "Listing"
            SET location = ST_SetSRID(ST_MakePoint(${29.4580}, ${-1.6870}), 4326)
            WHERE id = ${listings[1].id}
          `;
        }
        console.log('Sample listings created');
      }
    }

    // Seed sample requests (for acceptor)
    if (acceptor) {
      const requestsExist = await prisma.request.count({ where: { userId: acceptor.id } });
      if (requestsExist === 0) {
        // Create request without location
        const request = await prisma.request.create({
          data: {
            userId: acceptor.id,
            title: 'Children\'s Clothes Needed',
            description: 'Looking for clothes for 15 kids, sizes 4-10.',
            category: 'CLOTHING',
            quantity: 15,
            status: 'OPEN',
          },
        });
        console.log('Sample request created');
      }
    }

    // Seed sample messages
    if (donor && acceptor) {
      const messagesExist = await prisma.message.count({ where: { senderId: donor.id } });
      if (messagesExist === 0) {
        const listing = await prisma.listing.findFirst({ where: { userId: donor.id } });
        if (listing) {
          await prisma.message.create({
            data: {
              senderId: donor.id,
              receiverId: acceptor.id,
              listingId: listing.id,
              content: 'Hi, saw your request for clothes. I have some that might work!',
              createdAt: new Date(),
            },
          });
          console.log('Sample message created');
        }
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();