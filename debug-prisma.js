const { PrismaClient } = require('./app/generated/prisma');
const prisma = new PrismaClient();
prisma.dailyProblem.findMany({ orderBy: { date: 'asc' } }).then(res => {
  console.log('Prisma output:', res.map(r => r.date.toISOString()));
});
