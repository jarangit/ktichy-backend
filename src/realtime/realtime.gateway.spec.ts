import { RealtimeGateway } from './realtime.gateway';
import { AppJwtPayload } from '../auth/type';

describe('RealtimeGateway', () => {
  const verifyAsync = jest.fn();
  const storeRepository = {
    findOne: jest.fn(),
  };
  const stationRepository = {
    findOne: jest.fn(),
  };

  const createSocket = (options?: { token?: string; auth?: AppJwtPayload }) => {
    return {
      id: 'socket-1',
      handshake: {
        auth: { token: options?.token },
        headers: {},
      },
      data: options?.auth ? { auth: options.auth } : {},
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
    } as any;
  };

  let gateway: RealtimeGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new RealtimeGateway(
      { verifyAsync } as any,
      storeRepository as any,
      stationRepository as any,
    );
    (gateway as any).server = {
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    };
  });

  it('disconnects sockets with invalid token', async () => {
    verifyAsync.mockRejectedValueOnce(new Error('bad token'));
    const client = createSocket({ token: 'bad-token' });

    await gateway.handleConnection(client);

    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('attaches auth payload for valid token', async () => {
    const auth: AppJwtPayload = {
      sub: 'user-1',
      tokenType: 'user',
      email: 'owner@example.com',
    };
    verifyAsync.mockResolvedValueOnce(auth);
    const client = createSocket({ token: 'good-token' });

    await gateway.handleConnection(client);

    expect(client.data.auth).toEqual(auth);
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('allows a device to join only its own rooms', async () => {
    const client = createSocket({
      auth: {
        sub: 'device-1',
        tokenType: 'device',
        store: 'store-1',
        station: 'station-1',
      },
    });

    await gateway.joinRoom(client, {
      storeId: 'store-1',
      stationId: 'station-1',
    });

    expect(client.join).toHaveBeenCalledWith('store:store-1');
    expect(client.join).toHaveBeenCalledWith('station:station-1');
  });

  it('does not join a device to another station', async () => {
    const client = createSocket({
      auth: {
        sub: 'device-1',
        tokenType: 'device',
        store: 'store-1',
        station: 'station-1',
      },
    });

    await gateway.joinRoom(client, { stationId: 'station-2' });

    expect(client.join).not.toHaveBeenCalled();
  });

  it('allows an owner to join their store room', async () => {
    storeRepository.findOne.mockResolvedValueOnce({
      id: 'store-1',
      owner_id: 'user-1',
    });
    const client = createSocket({
      auth: {
        sub: 'user-1',
        tokenType: 'user',
        email: 'owner@example.com',
      },
    });

    await gateway.joinRoom(client, { storeId: 'store-1' });

    expect(storeRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'store-1', owner_id: 'user-1' },
    });
    expect(client.join).toHaveBeenCalledWith('store:store-1');
  });

  it('does not join an owner to someone else station room', async () => {
    stationRepository.findOne.mockResolvedValueOnce(null);
    const client = createSocket({
      auth: {
        sub: 'user-1',
        tokenType: 'user',
        email: 'owner@example.com',
      },
    });

    await gateway.joinRoom(client, { stationId: 'station-2' });

    expect(client.join).not.toHaveBeenCalled();
  });
});
