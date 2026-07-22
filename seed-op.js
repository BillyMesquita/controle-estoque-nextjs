const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
(async () => {
  const hash = bcrypt.hashSync('123456', 10);
  const existing = await prisma.user.findUnique({ where: { username: 'opdev' } });
  if (!existing) {
    await prisma.user.create({ data: { name: 'Operador Dev', username: 'opdev', passwordHash: hash, role: 'Operador', permissions: null } });
    console.log('opdev created');
  } else {
    console.log('opdev exists:', existing.id, 'role:', existing.role, 'permissions:', JSON.stringify(existing.permissions));
  }
  await prisma.$disconnect();
})();
