import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { TaskPriority } from '../enums/task-priority.enum.js';
import { CreateTaskDto } from './create-task.dto.js';
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
});

describe('UpdateTaskDto', () => {
  it('rejects an empty body', async () => {
    const { errors } = await parse(UpdateTaskDto, {});

    expect(errors.length).toBeGreaterThan(0);
  });

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
