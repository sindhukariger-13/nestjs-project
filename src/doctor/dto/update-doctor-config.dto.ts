export class UpdateDoctorConfigDto {
  schedulingType?: 'WAVE' | 'STREAM';

  waveConfig?: {
    startTime: string;
    endTime: string;
    maxPatients: number;
  };

  streamConfig?: {
    slotDuration: number;
    bufferTime?: number;
  };
}