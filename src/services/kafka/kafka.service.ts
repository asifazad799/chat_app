import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly KAFKA_BROKERS = ['localhost:9092'];
  private readonly CLIENT_ID = 'chat-client';

  private readonly logger = new Logger(KafkaService.name);

  private kafka: Kafka;
  private producer: Producer;

  constructor() {
    this.kafka = new Kafka({
      clientId: this.CLIENT_ID,
      brokers: this.KAFKA_BROKERS,
    });

    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect(),
    this.logger.log('Kafka connected');
  }

  async pushMessage({topic, message}:{topic: string, message: any}) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async disconnect() {
     await this.producer.disconnect(),
    this.logger.log('Kafka disconnected.');
  }
}
