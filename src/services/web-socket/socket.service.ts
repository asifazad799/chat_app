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

@WebSocketGateway({
  cors: {
    origin: '*', // Adjust for production
  },
  // Optional: Specify port or namespace
  // namespace: '/chat',
  // port: 3001
})
export class SocketSerive implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(SocketSerive.name);

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
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket
  ): string {
    this.logger.log(`Received from ${client.id}: ${JSON.stringify(data)}`);
    
    // Broadcast to all clients except sender
    client.broadcast.emit('message', {
      from: client.id,
      message: data,
      timestamp: new Date().toISOString()
    });

    // Return acknowledgement to sender
    return 'Message received';
  }

  sendMessage(message: string, room?: string) {
    if (!this.server) {
      throw new Error('Socket server not initialized');
    }

    try {
      const parsed = JSON.parse(message);
      
      if (room) {
        // Emit to specific room
        this.server.to(room).emit('message', parsed);
      } else {
        // Broadcast to all connected clients
        this.server.emit('message', parsed);
      }
    } catch (error) {
      console.error('Error handling message:', error);
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