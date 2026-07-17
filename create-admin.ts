import prisma from './src/lib/prisma';
async function run() {
  try {
    const admin = await prisma.admin.upsert({
      where: { email: 'kadosh.finanzas@gmail.com' },
      update: {},
      create: {
        email: 'kadosh.finanzas@gmail.com',
        name: 'Admin Kadosh',
      }
    });
    console.log('Admin registrado con éxito en DB:', admin.email);
  } catch (err) { console.error('Prisma error:', err); }
  await prisma.$disconnect();
}
run();
