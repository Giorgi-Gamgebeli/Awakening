import { Body, Controller, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  register(@Body() createAuthDto: unknown) {
    return this.authService.register(createAuthDto);
  }

  @Post()
  login() {
    return this.authService.login();
  }

  @Post(':id')
  refresh(@Param('id') id: string) {
    return this.authService.refresh(+id);
  }

  @Post(':id')
  logout(@Param('id') id: string, @Body() updateAuthDto: unknown) {
    return this.authService.logout(+id, updateAuthDto);
  }
}
