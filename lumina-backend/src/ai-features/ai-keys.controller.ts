import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AiProvider } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtAuthUser } from '../auth/jwt-auth-user';
import { AiKeysService } from './ai-keys.service';
import { AiStaffGuard } from './ai-staff';
import {
  SaveAiKeyDto,
  TestAiKeyDto,
  UpdateAiPreferenceDto,
} from './dto/ai-keys.dto';

const ProviderParam = new ParseEnumPipe(AiProvider);

@UseGuards(JwtAuthGuard, AiStaffGuard, ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('ai/settings')
export class AiKeysController {
  constructor(private readonly keys: AiKeysService) {}

  @Get()
  getSettings(@CurrentUser() user: JwtAuthUser) {
    return this.keys.getSettings(user.id);
  }

  @Patch()
  setPreferred(
    @Body() dto: UpdateAiPreferenceDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.keys.setPreferredProvider(user.id, dto.preferredProvider);
  }

  @Put('keys/:provider')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  saveKey(
    @Param('provider', ProviderParam) provider: AiProvider,
    @Body() dto: SaveAiKeyDto,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.keys.saveKey(user.id, provider, dto.apiKey);
  }

  @Delete('keys/:provider')
  deleteKey(
    @Param('provider', ProviderParam) provider: AiProvider,
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.keys.deleteKey(user.id, provider);
  }

  @Post('keys/:provider/test')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  testKey(
    @Param('provider', ProviderParam) provider: AiProvider,
    @Body() dto: TestAiKeyDto = {},
    @CurrentUser() user: JwtAuthUser,
  ) {
    return this.keys.testKey(user.id, provider, dto.apiKey);
  }
}
