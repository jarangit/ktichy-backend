import { Order } from '../entities/order.entity';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // ปรับให้ตรงกับ frontend ของคุณ
  },
})
export class OrderGateway {
  @WebSocketServer()
  server: Server;

  notifyNewOrder(order: Order) {
    this.server.emit('new-order', order);
  }
  // order.gateway.ts
  notifyOrderDeleted(orderId: number) {
    this.server.emit('order-deleted', { id: orderId });
  }

  notifyOrderUpdated(order: Order) {
    this.server.emit('order-updated', order);
  }
}
