import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MachineService } from './machine.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('machine')
export class MachineController {
  constructor(private readonly machineService: MachineService) {}

  @Post()
  async getMyMachine(@Body() body: any) {
    return this.machineService.getMyMachine(body);
  }

  @Get('all')
  async getAllMachines() {
    return this.machineService.getAllMachines();
  }

  @Get(':id')
  async getOneMachine(@Param('id') id: string) {
    return this.machineService.getOneMachine(id);
  }

  @Post('new-machine')
  @UseGuards(JwtAuthGuard)
  async createNewMachine(@Body() body: any) {
    return this.machineService.createNewMachine(body);
  }

  @Post('edit')
  @UseGuards(JwtAuthGuard)
  async editMachine(@Body() body: any) {
    return this.machineService.editMachine(body);
  }

  @Post('delete')
  @UseGuards(JwtAuthGuard)
  async deleteMachine(@Body() body: any) {
    return this.machineService.deleteMachine(body);
  }

  @Post('change-adress')
  async changeAddress(@Body() body: any) {
    return this.machineService.changeAddress(body);
  }

  @Post('balance-up')
  async machineBalanceUp(@Body() body: any) {
    return this.machineService.machineBalanceUp(body);
  }

  @Post('block-machine')
  async blockOrUnblockMachine(@Body() body: any) {
    return this.machineService.blockOrUnblockMachine(body);
  }
}
