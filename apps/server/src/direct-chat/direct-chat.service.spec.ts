import { Test, TestingModule } from '@nestjs/testing';
import { DirectChatService } from './direct-chat.service';

describe('DirectChatService', () => {
  let service: DirectChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DirectChatService],
    }).compile();

    service = module.get<DirectChatService>(DirectChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
