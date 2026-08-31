import { Module } from '@nestjs/common';
import { EscapeRoomLiveService } from './escape-room-live.service';

@Module({
  providers: [EscapeRoomLiveService],
  exports: [EscapeRoomLiveService],
})
export class EscapeRoomModule {}
