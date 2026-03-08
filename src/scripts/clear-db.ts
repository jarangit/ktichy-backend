import { AppDataSource } from '../data-source';

async function clearDb() {
  await AppDataSource.initialize();

  try {
    await AppDataSource.dropDatabase();
    await AppDataSource.synchronize();
    // eslint-disable-next-line no-console
    console.log(
      'Database reset complete: dropped old data and recreated schema',
    );
  } finally {
    await AppDataSource.destroy();
  }
}

clearDb().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Database reset failed', error);
  process.exit(1);
});
