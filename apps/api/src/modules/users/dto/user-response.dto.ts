import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserResponseDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() email: string;
  @Expose() @ApiProperty({ nullable: true }) name: string | null;
  @Expose() @ApiProperty({ nullable: true }) whatsappNumber: string | null;
  @Expose() @ApiProperty() createdAt: Date;
}
