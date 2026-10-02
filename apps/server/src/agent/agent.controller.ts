import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Implement } from '@orpc/nest';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { agentContract } from '@repo/zod';
import { implement } from '@orpc/server';

@UseGuards(AuthGuard)
@Controller()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentService.create(createAgentDto);
  }

  @Get()
  findAll() {
    return this.agentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentDto: UpdateAgentDto) {
    return this.agentService.update(+id, updateAgentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentService.remove(+id);
  }

  @Implement(agentContract.chat)
  chat(@Session() session: UserSession) {
    return implement(agentContract.chat).handler(({ input }) =>
      this.agentService.chat(input, session.user.id),
    );
  }
}
