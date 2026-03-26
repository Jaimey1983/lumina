import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../auth/roles.guard';
  import { Roles } from '../auth/roles.decorator';
  
  @Controller('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    // GET /users?page=1&limit=20 (solo ADMIN)
    @Get()
    @Roles('ADMIN', 'SUPERADMIN')
    findAll(
      @Query('page') page = '1',
      @Query('limit') limit = '20',
    ) {
      return this.usersService.findAll(+page, +limit);
    }
  
    // GET /users/:id
    @Get(':id')
    @Roles('ADMIN', 'SUPERADMIN', 'TEACHER')
    findOne(@Param('id') id: string) {
      return this.usersService.findOne(id);
    }
  
    // PATCH /users/:id
    @Patch(':id')
    update(
      @Param('id') id: string,
      @Body() dto: UpdateUserDto,
      @Request() req,
    ) {
      return this.usersService.update(id, dto, req.user);
    }
  
    // DELETE /users/:id (solo ADMIN)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @Roles('ADMIN', 'SUPERADMIN')
    remove(@Param('id') id: string) {
      return this.usersService.remove(id);
    }
  }
