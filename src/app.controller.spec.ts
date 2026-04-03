import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello Kitchy"', () => {
      expect(appController.getHello()).toBe('Hello Kitchy');
    });
  });

  describe('health', () => {
    it('should return healthcheck payload', () => {
      const health = appController.getHealth();

      expect(health.status).toBe('ok');
      expect(new Date(health.timestamp).toString()).not.toBe('Invalid Date');
    });
  });
});
