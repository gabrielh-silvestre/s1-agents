import { GuardError } from '../errors/guard-error';

/**
 * Represents an internal error of the library.
 */
export class Validator {
  /**
   * Guards against a specified condition and throws a `GuardError` if the condition is not met.
   * @param condition - The condition to be checked.
   * @param message - The error message to be thrown if the condition is not met.
   */
  static guard(condition: any, message: string) {
    if (!condition) throw new GuardError(message);
  }

  /**
   * Checks if a value is not null or undefined.
   * @param value - The value to check.
   * @param message - The error message to throw if the value is null or undefined.
   */
  static notNull<T>(value: T | null | undefined, message: string) {
    this.guard(value !== null && value !== undefined, message);
  }

  /**
   * Checks if a string value is not empty or consists only of whitespace.
   * @param value - The string value to check.
   * @param message - The error message to throw if the value is empty or consists only of whitespace.
   */
  static notEmpty(value: string, message: string) {
    this.guard(value?.trim()?.length > 0, message);
  }

  /**
   * Checks if an array is not empty.
   * @param value - The array to check.
   * @param message - The error message to throw if the array is empty.
   */
  static notEmptyArray<T>(value: T[], message: string) {
    this.guard(value?.length > 0, message);
  }

  /**
   * Checks if an object is not empty.
   * @param value - The object to check.
   * @param message - The error message to throw if the object is empty.
   */
  static notEmptyObject<T>(value: T, message: string) {
    this.guard(Object.keys(value ?? {}).length > 0, message);
  }

  /**
   * Checks if an array contains duplicate elements.
   * @param value - The array to check for duplicates, only accept primitive values.
   * @param message - The error message to throw if duplicates are found.
   * @template T - The type of elements in the array.
   */
  static duplicatedArray<T>(value: T[], message: string) {
    const unique = new Set(value ?? [{}]);
    this.guard(value.length === unique.size, message);
  }
}
