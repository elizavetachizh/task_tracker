import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { TaskPriority } from '../enums/task-priority.enum.js';
import { TaskStatus } from '../enums/task-status.enum.js';
import { CreateTaskDto } from './create-task.dto.js';
import { MoveTaskDto } from './move-task.dto.js';
import { UpdateTaskDto } from './update-task.dto.js';

async function parse<T extends object>(cls: new () => T, plain: object) {
  const dto = plainToInstance(cls, plain);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errors };
}

describe('CreateTaskDto', () => {
  it('trims title and keeps a valid priority', async () => {
    const { dto, errors } = await parse(CreateTaskDto, {
      title: '  Название  ',
      priority: TaskPriority.High,
    });

    expect(errors).toEqual([]);
    expect(dto.title).toBe('Название');
    expect(dto.priority).toBe(TaskPriority.High);
    expect(dto.description).toBeUndefined();
  });

  it('stores a blank description as null', async () => {
    const { dto, errors } = await parse(CreateTaskDto, {
      title: 'Название',
      description: '   ',
    });

    expect(errors).toEqual([]);
    expect(dto.description).toBeNull();
  });

  it('rejects a blank title and an unknown priority', async () => {
    const blankTitle = await parse(CreateTaskDto, { title: '   ' });
    const unknownPriority = await parse(CreateTaskDto, {
      title: 'Название',
      priority: 'urgent',
    });

    expect(blankTitle.errors.length).toBeGreaterThan(0);
    expect(unknownPriority.errors.length).toBeGreaterThan(0);
  });

  it('rejects a title longer than 200 characters', async () => {
    const { errors } = await parse(CreateTaskDto, { title: 'а'.repeat(201) });

    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('rejects a description longer than 2000 characters', async () => {
    const { errors } = await parse(CreateTaskDto, {
      title: 'Название',
      description: 'а'.repeat(2001),
    });

    expect(errors.some((error) => error.property === 'description')).toBe(true);
  });
});

describe('UpdateTaskDto', () => {
  it('trims title and clears description', async () => {
    const { dto, errors } = await parse(UpdateTaskDto, {
      title: '  Новое  ',
      description: '',
    });

    expect(errors).toEqual([]);
    expect(dto.title).toBe('Новое');
    expect(dto.description).toBeNull();
  });

  it('rejects an unknown priority', async () => {
    const { errors } = await parse(UpdateTaskDto, { priority: 'urgent' });

    expect(errors.some((error) => error.property === 'priority')).toBe(true);
  });

  it('rejects an extra field', async () => {
    const { errors } = await parse(UpdateTaskDto, {
      title: 'Новое',
      status: 'done',
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('MoveTaskDto', () => {
  it('accepts a column status', async () => {
    const { dto, errors } = await parse(MoveTaskDto, {
      status: TaskStatus.InProgress,
    });

    expect(errors).toEqual([]);
    expect(dto.status).toBe(TaskStatus.InProgress);
  });

  it('rejects a missing or unknown status', async () => {
    const missing = await parse(MoveTaskDto, {});
    const unknown = await parse(MoveTaskDto, { status: 'urgent' });

    expect(missing.errors.some((error) => error.property === 'status')).toBe(
      true,
    );
    expect(unknown.errors.some((error) => error.property === 'status')).toBe(
      true,
    );
  });

  it('rejects an extra field', async () => {
    const { errors } = await parse(MoveTaskDto, {
      status: TaskStatus.Done,
      position: 1,
    });

    expect(errors.length).toBeGreaterThan(0);
  });
});
