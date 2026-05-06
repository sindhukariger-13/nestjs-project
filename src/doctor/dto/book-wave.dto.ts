import { IsString } from 'class-validator';

export class BookWaveDto {
  @IsString()
  waveId!: string;
}