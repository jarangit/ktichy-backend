import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { InjectRepository } from '@nestjs/typeorm';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';

@WebSocketGateway({
  cors: { origin: process.env.CLIENT_URL, credentials: true },
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  @SubscribeMessage('join-room')
  joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { storeId?: string; stationId?: string },
  ) {
    if (payload.storeId) client.join(`store:${payload.storeId}`);
    if (payload.stationId) client.join(`station:${payload.stationId}`);
  }

  @SubscribeMessage('leave-room')
  leaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { storeId?: string; stationId?: string },
  ) {
    if (payload.storeId) client.leave(`store:${payload.storeId}`);
    if (payload.stationId) client.leave(`station:${payload.stationId}`);
  }

  @SubscribeMessage('receipt.join')
  async joinReceipt(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiptToken?: string },
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

    client.join(`receipt:${payload.receiptToken}`);
  }

  @SubscribeMessage('receipt.leave')
  leaveReceipt(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiptToken?: string },
  ) {
    if (payload.receiptToken) client.leave(`receipt:${payload.receiptToken}`);
  }

  async emitOrderUpdated(order: Order) {
    this.server?.to(`store:${order.store?.id}`).emit('order.updated', {
      orderId: order.id,
      storeId: order.store?.id,
    });

    const payment = await this.paymentRepository.findOne({
      where: { order: { id: order.id } },
      relations: ['order'],
    });

    if (!payment) return;

    if (payment.receiptExpiresAt.getTime() <= Date.now()) {
      this.server
        ?.to(`receipt:${payment.receiptToken}`)
        .emit('receipt.expired', {
          receiptToken: payment.receiptToken,
          expiredAt: payment.receiptExpiresAt,
        });
      return;
    }

    this.server?.to(`receipt:${payment.receiptToken}`).emit('receipt.updated', {
      receiptToken: payment.receiptToken,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      updatedAt: order.updatedAt,
    });
  }
}
