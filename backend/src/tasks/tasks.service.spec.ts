import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task } from './entities/task.entity.js';
import { TaskPriority } from './enums/task-priority.enum.js';
import { TaskStatus } from './enums/task-status.enum.js';
import { TasksService } from './tasks.service.js';

const taskId = '11111111-1111-4111-8111-111111111111';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: taskId,
    title: 'Название',
    description: null,
    priority: TaskPriority.Medium,
    status: TaskStatus.New,
    position: 1,
    createdAt: new Date('2026-10-19T12:00:00.000Z'),
    updatedAt: new Date('2026-10-19T12:00:00.000Z'),
    ...overrides,
  };
}

describe('TasksService', () => {
  let service: TasksService;

  const queryBuilder = {
    select: vi.fn(),
    where: vi.fn(),
    getRawOne: vi.fn(),
  };

  const repository = {
    create: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    queryBuilder.select.mockReturnThis();
    queryBuilder.where.mockReturnThis();
    repository.create.mockImplementation((value: Partial<Task>) => value);
    repository.save.mockImplementation(async (value: Partial<Task>) => ({
      ...makeTask(),
      ...value,
    }));
    repository.createQueryBuilder.mockReturnValue(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get(TasksService);
  });

  it('creates a task with status new at the end of the column', async () => {
    queryBuilder.getRawOne.mockResolvedValue({ max: '2' });

    const view = await service.create({
      title: 'Название',
      priority: TaskPriority.High,
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('task.status = :status', {
      status: TaskStatus.New,
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Название',
        priority: TaskPriority.High,
        status: TaskStatus.New,
        position: 3,
      }),
    );
    expect(repository.save).toHaveBeenCalledOnce();
    expect(view.status).toBe(TaskStatus.New);
    expect(view.position).toBe(3);
  });

  it('rejects a whitespace title before save', async () => {
    await expect(service.create({ title: '   ' })).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('places the first task in an empty column at position 1', async () => {
    queryBuilder.getRawOne.mockResolvedValue({ max: null });

    const view = await service.create({ title: 'Первая' });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TaskStatus.New,
        position: 1,
      }),
    );
    expect(view.position).toBe(1);
  });

  it('updates title and priority without writing a new status', async () => {
    repository.findOne.mockResolvedValue(
      makeTask({
        title: 'Старое',
        priority: TaskPriority.Low,
        status: TaskStatus.New,
        position: 2,
      }),
    );

    const view = await service.update(taskId, {
      title: 'Новое',
      priority: TaskPriority.High,
      status: TaskStatus.Done,
    } as UpdateTaskDto);

    expect(repository.save).toHaveBeenCalledOnce();
    const saved = repository.save.mock.calls[0][0] as Task;
    expect(saved.title).toBe('Новое');
    expect(saved.priority).toBe(TaskPriority.High);
    expect(saved.status).toBe(TaskStatus.New);
    expect(saved.position).toBe(2);
    expect(view.status).toBe(TaskStatus.New);
    expect(view.priority).toBe(TaskPriority.High);
  });

  it('moves a task to the end of another column', async () => {
    repository.findOne.mockResolvedValue(
      makeTask({ status: TaskStatus.New, position: 1 }),
    );
    queryBuilder.getRawOne.mockResolvedValue({ max: 4 });

    const view = await service.move(taskId, {
      status: TaskStatus.InProgress,
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('task.status = :status', {
      status: TaskStatus.InProgress,
    });
    const saved = repository.save.mock.calls[0][0] as Task;
    expect(saved.status).toBe(TaskStatus.InProgress);
    expect(saved.position).toBe(5);
    expect(view.status).toBe(TaskStatus.InProgress);
    expect(view.position).toBe(5);
  });

  it('does not recalculate position when moving inside the same column', async () => {
    repository.findOne.mockResolvedValue(
      makeTask({ status: TaskStatus.Done, position: 3 }),
    );

    const view = await service.move(taskId, { status: TaskStatus.Done });

    expect(repository.createQueryBuilder).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
    expect(view.status).toBe(TaskStatus.Done);
    expect(view.position).toBe(3);
  });

  it('throws NotFoundException when reading or deleting a missing task', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(taskId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.delete(taskId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when updating or moving a missing task', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.update(taskId, { title: 'Новое' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.move(taskId, { status: TaskStatus.InProgress }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects an empty update', async () => {
    await expect(service.update(taskId, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(repository.findOne).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
