import { Injectable } from '@nestjs/common';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { UpdateDirectChatDto } from './dto/update-direct-chat.dto';

@Injectable()
export class DirectChatService {
  create(createDirectChatDto: CreateDirectChatDto) {
    return 'This action adds a new directChat';
  }

  findAll() {
    return `This action returns all directChat`;
  }

  findOne(id: number) {
    return `This action returns a #${id} directChat`;
  }

  update(id: number, updateDirectChatDto: UpdateDirectChatDto) {
    return `This action updates a #${id} directChat`;
  }

  remove(id: number) {
    return `This action removes a #${id} directChat`;
  }
}
