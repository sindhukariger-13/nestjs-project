export class CreateScheduleDto {
  doctorId!: string;

  startTime!: string;
  endTime!: string;

  // for STREAM
  slotDuration?: number;
  bufferTime?: number;

  // for WAVE
  capacity?: number;
}