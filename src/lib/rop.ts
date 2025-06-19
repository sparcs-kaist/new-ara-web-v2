type OK<T> = { ok: true; value: T }
type Err<E> = { ok: false; error: E }
export type Result<T, E> = OK<T> | Err<E>

export function ok<T>(value: T): OK<T> {
  return { ok: true, value }
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

export const toResult = async <T>(promise: Promise<T>): Promise<Result<T, unknown>> => {
  try {
    const value = await promise
    return ok(value)
  } catch (error) {
    return err(error)
  }
}