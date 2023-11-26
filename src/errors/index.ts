import { GuardError } from './guard-error';

export class InternalError {
  static guard(condition: boolean, message: string) {
    if (!condition) throw new GuardError(message);
  }

  static notNull<T>(value: T | null | undefined, message: string) {
    this.guard(value !== null && value !== undefined, message);
  }

  static notEmpty(value: string, message: string) {
    this.guard(value?.length > 0, message);
  }

  static notEmptyArray<T>(value: T[], message: string) {
    this.guard(value?.length > 0, message);
  }

  static notEmptyObject<T>(value: T, message: string) {
    this.guard(Object.keys(value ?? {}).length > 0, message);
  }

  static duplicatedArray<T>(value: T[], message: string) {
    const unique = new Set(value ?? [{}]);
    this.guard(value.length === unique.size, message);
  }
}
