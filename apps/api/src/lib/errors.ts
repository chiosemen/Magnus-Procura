export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  public constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends HttpError {
  public constructor(message = 'Authentication is required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends HttpError {
  public constructor(message = 'You do not have access to this resource') {
    super(403, 'FORBIDDEN', message);
  }
}

export class BadRequestError extends HttpError {
  public constructor(message = 'Request is invalid') {
    super(400, 'BAD_REQUEST', message);
  }
}

export class UpstreamServiceError extends HttpError {
  public constructor(message = 'Upstream service failed') {
    super(502, 'UPSTREAM_FAILURE', message);
  }
}
