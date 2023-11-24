export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardError';
  }

  static guard(condition: boolean, message: string) {
    if (!condition) throw new GuardError(message);
  }
}
