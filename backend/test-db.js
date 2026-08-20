const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const passwords = [
        'postgres', 'root', 'admin', 'password', '123456', '1234', 'password123',
        'admin123', 'root123', 'postgres123', 'system', '12345678', 'Reachinbox@123', 'Reachinbox123', ''
    ];
    const users = ['postgres'];

    for (const user of users) {
        for (const pass of passwords) {
            const url = `postgresql://${user}:${pass}@localhost:5432/postgres?schema=public`;
            const client = new PrismaClient({ datasources: { db: { url } } });
            try {
                await client.$connect();
                console.log('MATCH_FOUND_SUCCESS:', url);
                await client.$disconnect();
                return;
            } catch (err) {
                console.log(`Failed ${user}:${pass} ->`, err.message.slice(0, 70));
            }
        }
    }
}

testConnection();
