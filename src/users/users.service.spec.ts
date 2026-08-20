import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

jest.mock('google-auth-library');

import { OAuth2Client } from 'google-auth-library';

const OAuth2ClientMock = OAuth2Client as jest.MockedClass<typeof OAuth2Client>;

describe('UsersService', () => {
  let service: UsersService;

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-token') },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  afterAll(() => {
    delete process.env.GOOGLE_CLIENT_ID;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('googleLogin', () => {
    const payload = {
      aud: 'test-client-id',
      sub: 'google-sub-123',
      email: 'user@gmail.com',
      email_verified: true,
    };

    const mockIdTokenVerification = (
      overrides: Partial<typeof payload> = {},
    ) => {
      (OAuth2ClientMock.prototype.verifyIdToken as jest.Mock).mockResolvedValue(
        {
          getPayload: () => ({ ...payload, ...overrides }),
        },
      );
      (OAuth2ClientMock.prototype.getTokenInfo as jest.Mock).mockRejectedValue(
        new Error('not an access token'),
      );
    };

    const mockAccessTokenVerification = (
      overrides: Partial<typeof payload> = {},
    ) => {
      (OAuth2ClientMock.prototype.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('invalid ID token'),
      );
      (OAuth2ClientMock.prototype.getTokenInfo as jest.Mock).mockResolvedValue({
        ...payload,
        email_verified: String(payload.email_verified),
        ...overrides,
      });
    };

    it('returns a token for an existing user matched by verified email', async () => {
      mockIdTokenVerification();
      mockRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'user@gmail.com',
        phoneNumber: null,
      });

      const result = await service.googleLogin({ idToken: 'id-token' });

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'user@gmail.com' },
      });
      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('creates a new user (with username) when email is unknown', async () => {
      mockIdTokenVerification();
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockImplementation((dto: Partial<User>) => dto);
      mockRepo.save.mockImplementation(async (dto: Partial<User>) => ({
        id: 'new-user',
        ...dto,
      }));

      const result = await service.googleLogin({ idToken: 'id-token' });

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@gmail.com',
          username: expect.stringMatching(/^user_/),
        }),
      );
      expect(mockRepo.save).toHaveBeenCalled();
    });

    it('supports a legacy OAuth access token via getTokenInfo', async () => {
      mockAccessTokenVerification();
      mockRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'user@gmail.com',
        phoneNumber: null,
      });

      const result = await service.googleLogin({
        idToken: 'access-token',
      });

      expect(result).toEqual({ access_token: 'signed-token' });
      expect(OAuth2ClientMock.prototype.getTokenInfo).toHaveBeenCalledWith(
        'access-token',
      );
    });

    it('rejects when the Google account has no email', async () => {
      mockIdTokenVerification({ email: undefined });
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.googleLogin({ idToken: 'id-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the Google email is not verified', async () => {
      mockIdTokenVerification({ email_verified: false });
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.googleLogin({ idToken: 'id-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the token cannot be verified', async () => {
      (OAuth2ClientMock.prototype.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error('invalid ID token'),
      );
      (OAuth2ClientMock.prototype.getTokenInfo as jest.Mock).mockRejectedValue(
        new Error('invalid access token'),
      );
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.googleLogin({ idToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
