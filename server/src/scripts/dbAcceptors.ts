import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function initializeDatabase(): Promise<void> {
  try {
    console.log('Creating acceptors...');

    // Create acceptor user if not exists
    const acceptorEmail = 'user2@acceptor.com';
      const acceptorExists = await prisma.user.findUnique({ where: { email: acceptorEmail } });
      
      if (!acceptorExists) {
          let acceptor;
          const hashedPassword = await bcrypt.hash('acceptorAkuzwe123!', 10);
          acceptor = await prisma.user.create({
              data: {
                  fname: 'Akuzwe2',
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
          console.log('Acceptor 2 user created');
      } else { 
        console.log('Acceptor 2 already exists');
      }

    console.log('Acceptor created successfully');
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();