import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { REDIS_EVENTS } from '../../constants';

@WebSocketGateway({
  cors: {
    origin: true, 
    credentials: true
  },
  transports: ['websocket'], // Force WebSocket-only mode
  allowUpgrades: false       // Disable HTTP upgrade fallback
})
export class SocketService implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(SocketService.name);

  constructor() {
    this.server?.on('connection', (socket) => {
      this.logger.log(`socket client connected: ${socket.id}`);
      socket.emit('connection-success', { 
        message: 'Successfully connected to WebSocket server',
        clientId: socket.id 
      });
    });
  }

  afterInit(server: Server) {
    this.logger.log('✅ WebSocket server initialized and listening');
    
    server.on('connection', (socket: Socket) => {
      this.logger.log(`🔌 Client connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        this.logger.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connection', { status: 'connected', id: client.id });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // 2. Basic message handlers
  @SubscribeMessage(REDIS_EVENTS.message)
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): string {
    this.logger.log(`Received from ${client.id}: ${JSON.stringify(data)}`); 

    if (data?.room_id && data?.message == 'join_room') {
      client.join(data?.room_id)
      client.to(data?.room_id).emit(REDIS_EVENTS.message, `${client.id} is joined to room`)
    }

    // Return acknowledgement to sender
    return 'Message received';
  }

  publish({message, event, room}:{message: any, event: string, room?: string}) {
    if (!this.server) {
      throw new Error('Socket server not initialized');
    }

    try {      
      if (room) {
        // Emit to specific room
        this.server.to(room).emit(event, message);
      } else {
        // Broadcast to all connected clients
        this.server.emit(event, message);
      }

    } catch (error) {
      console.error('Error handling message:', error);
      throw error
    }
  }

  // 3. Utility methods
  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  sendToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, data);
  }
}