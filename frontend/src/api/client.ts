import type { components } from './schema'

type Schemas = components['schemas']
/** Response models: springdoc marks every field optional, but the API always sends them (nullable ones may be null). */
export type Model<K extends keyof Schemas> = { [P in keyof Schemas[K]]-?: Schemas[K][P] }
export type Request<K extends keyof Schemas> = Schemas[K]

export type Task = Model<'Task'>
export type Habit = Model<'Habit'>
export type LearningCard = Model<'LearningCard'>
export type Plan = Model<'Plan'>
export type PlanItem = Model<'PlanItem'>
export type PlanSources = Model<'PlanSources'>
export type Settings = Model<'Settings'>
export type Dashboard = Model<'Dashboard'>

export interface FieldError { field: string; message: string }

/** A problem+json error from the backend, with per-field messages when the backend sent them. */
export class ApiError extends Error {
  status: number
  fieldErrors: FieldError[]
  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
  forField(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message
  }
}

export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.detail ?? `Request failed (${res.status})`, data?.errors ?? [])
  return data as T
}

export const get = <T>(path: string) => api<T>('GET', path)
