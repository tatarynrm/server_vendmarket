import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Post('new-user')
  @UseGuards(JwtAuthGuard)
  async createNewUser(@Body() body: any) {
    return this.userService.createNewUser(body);
  }

  @Post('update')
  async userUpdate(@Body() body: any) {
    return this.userService.userUpdate(body);
  }

  @Post('delete')
  async userDelete(@Body() body: any) {
    return this.userService.userDelete(body);
  }

  @Post('cancel-active')
  async cancelActiveFalse(@Body() body: any) {
    return this.userService.cancelActiveFalse(body);
  }
}
