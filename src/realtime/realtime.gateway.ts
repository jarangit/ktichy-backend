import {
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { AppJwtPayload } from '../auth/type';
import { Payment } from '../payments/entities/payment.entity';
import { Station } from '../stations/entities/station.entity';
import { Store } from '../stores/entities/store.entity';

type JoinRoomPayload = {
  storeId?: string;
  stationId?: string;
};

type ReceiptRoomPayload = {
  receiptToken?: string;
};

type RealtimeClientData = {
  auth?: AppJwtPayload;
};

type RealtimeSocket = Socket<any, any, any, RealtimeClientData>;

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
const receiptRoom = (receiptToken: string) => `receipt:${receiptToken}`;

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
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: RealtimeSocket) {
    const token = this.extractToken(client);

    if (!token) {
      this.debug('public socket connected', { socketId: client.id });
      return;
    }

    try {
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

  @SubscribeMessage('receipt.join')
  async joinReceipt(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ReceiptRoomPayload,
  ) {
    if (!payload.receiptToken) return;

    const payment = await this.paymentRepository.findOne({
      where: { receiptToken: payload.receiptToken },
    });

    if (!payment) return;

    if (payment.receiptExpiresAt.getTime() <= Date.now()) {
      client.emit('receipt.expired', {
        receiptToken: payload.receiptToken,
        expiredAt: payment.receiptExpiresAt,
      });
      return;
    }

    await client.join(receiptRoom(payload.receiptToken));
    this.debug('receipt room joined', {
      socketId: client.id,
      receiptToken: payload.receiptToken,
    });
  }

  @SubscribeMessage('receipt.leave')
  async leaveReceipt(
    @ConnectedSocket() client: RealtimeSocket,
    @MessageBody() payload: ReceiptRoomPayload,
  ) {
    if (!payload.receiptToken) return;

    await client.leave(receiptRoom(payload.receiptToken));
    this.debug('receipt room left', {
      socketId: client.id,
      receiptToken: payload.receiptToken,
    });
  }

  emitOrderCreated(event: OrderCreatedEvent) {
    this.debug('emit order.created', event);
    this.server.to(storeRoom(event.storeId)).emit('order.created', event);

    for (const stationId of event.stationIds) {
      this.server.to(stationRoom(stationId)).emit('order.created', event);
    }
  }

  async emitOrderUpdated(event: OrderUpdatedEvent) {
    this.debug('emit order.updated', event);
    this.server.to(storeRoom(event.storeId)).emit('order.updated', event);
    await this.emitReceiptUpdated(event.orderId);
  }

  emitOrderStationItemUpdated(event: OrderStationItemUpdatedEvent) {
    this.debug('emit order.station-item.updated', event);
    this.server
      .to(stationRoom(event.stationId))
      .emit('order.station-item.updated', event);
  }

  private async emitReceiptUpdated(orderId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { order: { id: orderId } },
      relations: ['order'],
    });

    if (!payment) return;

    if (payment.receiptExpiresAt.getTime() <= Date.now()) {
      this.server
        .to(receiptRoom(payment.receiptToken))
        .emit('receipt.expired', {
          receiptToken: payment.receiptToken,
          expiredAt: payment.receiptExpiresAt,
        });
      return;
    }

    this.server.to(receiptRoom(payment.receiptToken)).emit('receipt.updated', {
      receiptToken: payment.receiptToken,
      orderId: payment.order.id,
      orderNumber: payment.order.orderNumber,
      status: payment.order.status,
      updatedAt: payment.order.updatedAt,
    });
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
