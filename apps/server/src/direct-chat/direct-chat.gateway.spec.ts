import { Test, TestingModule } from '@nestjs/testing';
import { DirectChatGateway } from './direct-chat.gateway';
import { DirectChatService } from './direct-chat.service';

describe('DirectChatGateway', () => {
  let gateway: DirectChatGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DirectChatGateway, DirectChatService],
    }).compile();

    gateway = module.get<DirectChatGateway>(DirectChatGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
