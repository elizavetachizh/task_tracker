import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidationArguments,
  registerDecorator,
} from 'class-validator';
import { TaskPriority } from '../enums/task-priority.enum.js';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimEmptyToNull({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function AtLeastOneField(properties: readonly string[]) {
  return function (target: Function) {
    registerDecorator({
      name: 'atLeastOneField',
      target,
      propertyName: '_atLeastOneField',
      constraints: [properties],
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value !== undefined) {
            return false;
          }

          const [fields] = args.constraints as [readonly string[]];
          const dto = args.object as Record<string, unknown>;
          return fields.some((field) => dto[field] !== undefined);
        },
        defaultMessage(args: ValidationArguments): string {
          if (args.value !== undefined) {
            return 'property _atLeastOneField should not exist';
          }

          return 'At least one of title, description or priority must be provided';
        },
      },
    });
  };
}

@AtLeastOneField(['title', 'description', 'priority'])
export class UpdateTaskDto {
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @Transform(trimEmptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
