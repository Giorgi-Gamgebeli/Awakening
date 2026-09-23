import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { DirectChatService } from './direct-chat.service';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { UpdateDirectChatDto } from './dto/update-direct-chat.dto';

@WebSocketGateway()
export class DirectChatGateway {
  constructor(private readonly directChatService: DirectChatService) {}

  @SubscribeMessage('createDirectChat')
  create(@MessageBody() createDirectChatDto: CreateDirectChatDto) {
    return this.directChatService.create(createDirectChatDto);
  }

  @SubscribeMessage('findAllDirectChat')
  findAll() {
    return this.directChatService.findAll();
  }

  @SubscribeMessage('findOneDirectChat')
  findOne(@MessageBody() id: number) {
    return this.directChatService.findOne(id);
  }

  @SubscribeMessage('updateDirectChat')
  update(@MessageBody() updateDirectChatDto: UpdateDirectChatDto) {
    return this.directChatService.update(updateDirectChatDto.id, updateDirectChatDto);
  }

  @SubscribeMessage('removeDirectChat')
  remove(@MessageBody() id: number) {
    return this.directChatService.remove(id);
  }
}
