export class UserNotFoundError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(userId: number) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
    this.code = 'USER_NOT_FOUND';
  }
}

export class InvalidUserDataError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserDataError';
    this.statusCode = 400;
    this.code = 'INVALID_USER_DATA';
  }
}
