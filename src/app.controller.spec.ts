import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const mockDataSource = { query: jest.fn().mockResolvedValue([{ 1: 1 }]) };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello Kitchy"', () => {
      expect(appController.getHello()).toBe('Hello Kitchy');
    });
  });

  describe('health', () => {
    it('should return healthcheck payload', async () => {
      const health = await appController.getHealth();

      expect(health.status).toBe('ok');
      expect(health.db).toBe('ok');
      expect(new Date(health.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should throw when the database is unreachable', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('connection lost'));

      await expect(appController.getHealth()).rejects.toThrow();
    });
  });
});

