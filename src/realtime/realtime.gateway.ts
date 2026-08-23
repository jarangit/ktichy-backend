import {
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import { AppJwtPayload } from '../auth/type';
import { Station } from '../stations/entities/station.entity';
import { Store } from '../stores/entities/store.entity';

type JoinRoomPayload = {
  storeId?: string;
  stationId?: string;
};

type RealtimeClientData = {
  auth?: AppJwtPayload;
};

type RealtimeSocket = Socket<unknown, unknown, unknown, RealtimeClientData>;

type OrderCreatedEvent = {
  orderId: string;
  storeId: string;
  stationIds: string[];
};

type OrderUpdatedEvent = {
  orderId: string;
  storeId: string;
};

type OrderStationItemUpdatedEvent = {
  orderStationItemId: string;
  stationId: string;
  status: 'pending' | 'complete' | 'served';
};

const storeRoom = (storeId: string) => `store:${storeId}`;
const stationRoom = (stationId: string) => `station:${stationId}`;

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Station)
    private readonly stationRepository: Repository<Station>,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: RealtimeSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('Missing realtime token');
      }

      client.data.auth = await this.jwtService.verifyAsync<AppJwtPayload>(
        token,
        {
          secret: process.env.JWT_SECRET || 'defaultSecret',
        },
      );

      this.debug('socket connected', {
        socketId: client.id,
        tokenType: client.data.auth.tokenType,
        subject: client.data.auth.sub,
      });
    } catch {
      this.debug('socket rejected', { socketId: client.id });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: RealtimeSocket) {
    this.debug('socket disconnected', { socketId: client.id });
  }

  @SubscribeMessage('join-room')
  async joinRoom(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    try {
      await this.assertJoinAllowed(client, payload);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        this.debug('room join rejected', {
          socketId: client.id,
          storeId: payload.storeId,
          stationId: payload.stationId,
          reason: error.message,
        });
        return;
      }

      throw error;
    }

    if (payload.storeId) {
      await client.join(storeRoom(payload.storeId));
    }

    if (payload.stationId) {
      await client.join(stationRoom(payload.stationId));
    }

    this.debug('room joined', {
      socketId: client.id,
      storeId: payload.storeId,
      stationId: payload.stationId,
    });
  }

  @SubscribeMessage('leave-room')
  async leaveRoom(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: JoinRoomPayload,
  ) {
    if (payload.storeId) {
      await client.leave(storeRoom(payload.storeId));
    }

    if (payload.stationId) {
      await client.leave(stationRoom(payload.stationId));
    }

    this.debug('room left', {
      socketId: client.id,
      storeId: payload.storeId,
      stationId: payload.stationId,
    });
  }

  emitOrderCreated(event: OrderCreatedEvent) {
    this.debug('emit order.created', event);
    this.server.to(storeRoom(event.storeId)).emit('order.created', event);

    for (const stationId of event.stationIds) {
      this.server.to(stationRoom(stationId)).emit('order.created', event);
    }
  }

  emitOrderUpdated(event: OrderUpdatedEvent) {
    this.debug('emit order.updated', event);
    this.server.to(storeRoom(event.storeId)).emit('order.updated', event);
  }

  emitOrderStationItemUpdated(event: OrderStationItemUpdatedEvent) {
    this.debug('emit order.station-item.updated', event);
    this.server
      .to(stationRoom(event.stationId))
      .emit('order.station-item.updated', event);
  }

  private debug(message: string, meta: Record<string, unknown>) {
    if (process.env.REALTIME_DEBUG !== 'true') {
      return;
    }

    this.logger.debug(`${message} ${JSON.stringify(meta)}`);
  }

  private extractToken(client: RealtimeSocket): string | undefined {
    const authToken = client.handshake.auth.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header !== 'string') {
      return undefined;
    }

    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private async assertJoinAllowed(
    client: RealtimeSocket,
    payload: JoinRoomPayload,
  ) {
    const auth = client.data.auth;
    if (!auth) {
      throw new UnauthorizedException('Realtime auth missing');
    }

    if (!payload.storeId && !payload.stationId) {
      throw new ForbiddenException('storeId or stationId is required');
    }

    if (auth.tokenType === 'device') {
      if (payload.storeId && payload.storeId !== auth.store) {
        throw new ForbiddenException('Device cannot join another store');
      }

      if (payload.stationId && payload.stationId !== auth.station) {
        throw new ForbiddenException('Device cannot join another station');
      }

      return;
    }

    if (payload.storeId) {
      const store = await this.storeRepository.findOne({
        where: { id: payload.storeId, owner_id: auth.sub },
      });
      if (!store) {
        throw new ForbiddenException('Store access denied');
      }
    }

    if (payload.stationId) {
      const station = await this.stationRepository.findOne({
        where: { id: payload.stationId, store: { owner_id: auth.sub } },
        relations: ['store'],
      });
      if (!station) {
        throw new ForbiddenException('Station access denied');
      }
    }
  }
}
