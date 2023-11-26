import { describe, expect, it } from 'bun:test';
import { GuardError } from 'src/errors/guard-error';
import { InternalError } from 'src/errors';

describe('[Unit] Tests for InternalError', () => {
  it.each([
    ['condition is falsy', false],
    ['condition is null', null],
    ['condition is undefined', undefined],
    ['condition is zero', 0],
    ['condition is empty', ''],
  ])('should throw an error when "%s"', (_, arg) => {
    try {
      InternalError.guard(arg, 'message');
      expect().fail('should throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('should throw an error when value is %s', (_, arg) => {
    try {
      InternalError.notNull(arg, 'message');
      expect().fail('should throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });

  it.each([
    ['empty', ''],
    ['blank', ' '],
  ])('should throw an error when value is %s', (_, arg) => {
    try {
      InternalError.notEmpty(arg, 'message');
      expect().fail('should throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });

  it('should throw an error when value array is empty', () => {
    try {
      InternalError.notEmptyArray([], 'message');
      expect().fail('should throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });

  it('should throw an error when value object is empty', () => {
    try {
      InternalError.notEmptyObject({}, 'message');
      expect().fail('should throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });

  it.each([
    ['number is duplicated', [1, 1]],
    ['string is duplicated', ['a', 'a']],
  ])('should throw an error when %s', (_, arg) => {
    try {
      InternalError.duplicatedArray<any>(arg, 'message');
      expect().fail('should throw an error');
    } catch (error) {
      expect(error).toBeInstanceOf(GuardError);
    }
  });
});
