import { IsEnum } from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum.js';

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  status: TaskStatus;
}
