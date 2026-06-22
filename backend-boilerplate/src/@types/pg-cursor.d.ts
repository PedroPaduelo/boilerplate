declare module 'pg-cursor' {
  import type { QueryResult, Submittable } from 'pg';

  interface CursorConfig {
    rowMode?: 'array';
    types?: unknown;
  }

  class Cursor<R extends Record<string, unknown> = Record<string, unknown>>
    implements Submittable
  {
    constructor(text: string, values?: unknown[], config?: CursorConfig);
    submit(connection: unknown): void;
    read(
      rowCount: number,
      callback: (err: Error | null, rows: R[], result: QueryResult<R>) => void
    ): void;
    read(rowCount: number): Promise<R[]>;
    close(callback?: (err?: Error) => void): void;
    close(): Promise<void>;
  }

  export = Cursor;
}
