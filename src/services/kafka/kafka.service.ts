import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, EachBatchPayload, Producer, ConsumerRunConfig } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);

  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;

  private readonly KAFKA_BROKERS = ['localhost:9092'];
  private readonly CLIENT_ID = 'nestjs-client';
  private readonly GROUP_ID = 'nestjs-consumer-group';

  async onModuleInit() {
    this.kafka = new Kafka({
      clientId: this.CLIENT_ID,
      brokers: this.KAFKA_BROKERS,
    });

    this.consumer = this.kafka.consumer({ groupId: this.GROUP_ID });
    this.producer = this.kafka.producer();

    await Promise.all([
      this.consumer.connect(),
      this.producer.connect(),
    ]);

    this.logger.log('Kafka connected successfully.');
  }

  async subscribeToTopic(topic: string) {
    await this.consumer.subscribe({ topic, fromBeginning: false });
    this.logger.log(`Subscribed to Kafka topic: ${topic}`);  
  }

  async runBatchProcessor(
    config: ConsumerRunConfig & { eachBatch: (payload: EachBatchPayload) => Promise<void> }
  ) {
    await this.consumer.run(config);
  }

  async sendMessage(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  public async retryOperation(
    operation: () => Promise<any>,
    maxRetry: number, 
    retryDelay: number
  ) {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetry; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetry) {
          this.logger.warn(`Retry attempt ${attempt} failed. Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          this.logger.error('Max retry attempts reached. Operation failed.');
          throw lastError;
        }
      }
    }
  }

  async disconnect() {
    await Promise.all([
      this.consumer.disconnect(),
      this.producer.disconnect(),
    ]);
    this.logger.log('Kafka disconnected.');
  }
}
