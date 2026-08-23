import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { io, Socket } from 'socket.io-client';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { Station } from '../src/stations/entities/station.entity';
import { Store } from '../src/stores/entities/store.entity';

describe('RealtimeGateway (network e2e)', () => {
  let app: INestApplication;
  let gateway: RealtimeGateway;
  let baseUrl: string;

  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  const storeRepositoryMock = {
    findOne: jest.fn(),
  };

  const stationRepositoryMock = {
    findOne: jest.fn(),
  };

  const sockets: Socket[] = [];

  const createClient = (token: string) => {
    const client = io(baseUrl, {
      transports: ['websocket'],
      auth: { token },
      forceNew: true,
      reconnection: false,
      timeout: 2000,
    });

    sockets.push(client);
    return client;
  };

  const waitForConnect = (client: Socket) =>
    new Promise<void>((resolve, reject) => {
      client.once('connect', () => resolve());
      client.once('connect_error', (error) => reject(error));
    });

  const waitForNoEvent = (client: Socket, event: string, timeout = 250) =>
    new Promise<void>((resolve, reject) => {
      const fail = () => reject(new Error(`Unexpected ${event} event`));
      client.once(event, fail);
      setTimeout(() => {
        client.off(event, fail);
        resolve();
      }, timeout);
    });

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeGateway,
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: getRepositoryToken(Store),
          useValue: storeRepositoryMock,
        },
        {
          provide: getRepositoryToken(Station),
          useValue: stationRepositoryMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);

    const address = app.getHttpServer().address();
    const port = typeof address === 'string' ? 0 : address.port;
    baseUrl = `http://127.0.0.1:${port}`;
    gateway = moduleFixture.get(RealtimeGateway);
  });

  afterEach(async () => {
    for (const socket of sockets.splice(0)) {
      if (socket.connected) {
        socket.disconnect();
      }
      socket.removeAllListeners();
    }

    if (app) {
      await app.close();
    }
  });

  it('connects with a valid token', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'user',
      email: 'owner@example.com',
    });

    const client = createClient('valid-token');
    await waitForConnect(client);

    expect(client.connected).toBe(true);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: process.env.JWT_SECRET || 'defaultSecret',
    });
  });

  it('rejects an invalid token during connect', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid token'));

    const client = createClient('bad-token');

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(client.connected).toBe(false);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('bad-token', {
      secret: process.env.JWT_SECRET || 'defaultSecret',
    });
  });

  it('delivers store events to an authorized room member', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      tokenType: 'user',
      email: 'owner@example.com',
    });
    storeRepositoryMock.findOne.mockResolvedValue({
      id: 'store-1',
      owner_id: 'user-1',
    });

    const client = createClient('valid-token');
    await waitForConnect(client);

    const received = new Promise<any>((resolve) => {
      client.once('order.created', resolve);
    });

    client.emit('join-room', { storeId: 'store-1' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    gateway.emitOrderCreated({
      orderId: 'order-1',
      storeId: 'store-1',
      stationIds: [],
    });

    await expect(received).resolves.toMatchObject({
      orderId: 'order-1',
      storeId: 'store-1',
    });
  });

  it('does not deliver station events when join-room is unauthorized', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'device-1',
      tokenType: 'device',
      store: 'store-1',
      station: 'station-1',
    });

    const client = createClient('device-token');
    await waitForConnect(client);

    client.emit('join-room', { stationId: 'station-2' });
    await new Promise((resolve) => setTimeout(resolve, 50));

    gateway.emitOrderStationItemUpdated({
      orderStationItemId: 'osi-1',
      stationId: 'station-2',
      status: 'pending',
    });

    await expect(
      waitForNoEvent(client, 'order.station-item.updated'),
    ).resolves.toBeUndefined();
  });
});
