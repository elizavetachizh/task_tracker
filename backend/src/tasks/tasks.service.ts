import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './entities/task.entity.js';
import { TaskPriority } from './enums/task-priority.enum.js';
import { TaskStatus } from './enums/task-status.enum.js';

export type TaskView = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  position: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
  ) {}

  private async getTask(id: string): Promise<Task> {
    const task = await this.tasks.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    return task;
  }

  private async nextPosition(status: TaskStatus): Promise<number> {
    const result = await this.tasks
      .createQueryBuilder('task')
      .select('MAX(task.position)', 'max')
      .where('task.status = :status', { status })
      .getRawOne<{ max: string | number | null }>();
    const maxPosition = result?.max == null ? null : Number(result.max);

    return maxPosition == null ? 1 : maxPosition + 1;
  }

  private normalizeTitle(title: string | undefined): string {
    const trimmed = typeof title === 'string' ? title.trim() : '';
    if (trimmed.length === 0) {
      throw new BadRequestException('Title must not be empty');
    }

    return trimmed;
  }

  private assertUpdateHasFields(dto: UpdateTaskDto): void {
    if (
      dto.title === undefined &&
      dto.description === undefined &&
      dto.priority === undefined
    ) {
      throw new BadRequestException(
        'At least one of title, description or priority must be provided',
      );
    }
  }

  private toView(task: Task): TaskView {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      position: task.position,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async findAll(): Promise<TaskView[]> {
    const tasks = await this.tasks.find({
      order: {
        status: 'ASC',
        position: 'ASC',
        createdAt: 'ASC',
      },
    });

    return tasks.map((task) => this.toView(task));
  }

  async create(dto: CreateTaskDto): Promise<TaskView> {
    const title = this.normalizeTitle(dto.title);
    const task = this.tasks.create({
      title,
      description: dto.description ?? null,
      priority: dto.priority ?? TaskPriority.Medium,
      status: TaskStatus.New,
      position: await this.nextPosition(TaskStatus.New),
    });
    const saved = await this.tasks.save(task);

    return this.toView(saved);
  }

  async findOne(id: string): Promise<TaskView> {
    const task = await this.getTask(id);
    return this.toView(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<TaskView> {
    this.assertUpdateHasFields(dto);
    const task = await this.getTask(id);

    if (dto.title !== undefined) {
      task.title = this.normalizeTitle(dto.title);
    }
    if (dto.description !== undefined) {
      task.description = dto.description;
    }
    if (dto.priority !== undefined) {
      task.priority = dto.priority;
    }

    const saved = await this.tasks.save(task);
    return this.toView(saved);
  }

  async delete(id: string): Promise<void> {
    const task = await this.getTask(id);
    await this.tasks.remove(task);
  }

  async move(id: string, dto: MoveTaskDto): Promise<TaskView> {
    const task = await this.getTask(id);

    if (task.status !== dto.status) {
      task.status = dto.status;
      task.position = await this.nextPosition(dto.status);
    }

    const saved = await this.tasks.save(task);
    return this.toView(saved);
  }
}
