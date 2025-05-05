import { Message } from '../../entities/message.entity';

export interface IMessageDispatcher {
  dispatchMessage({message}:{message : Message}): Promise<{success: boolean}>;
}