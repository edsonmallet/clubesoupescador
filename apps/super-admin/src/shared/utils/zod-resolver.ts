import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'

export function zodResolver<TFieldValues extends FieldValues>(
  schema: ZodType<TFieldValues>,
): Resolver<TFieldValues> {
  return (values) => {
    const result = schema.safeParse(values)

    if (result.success) {
      return { values: result.data, errors: {} }
    }

    const errors = {} as FieldErrors<TFieldValues>
    for (const issue of result.error.issues) {
      const path = issue.path.join('.') as keyof FieldErrors<TFieldValues>
      if (!errors[path]) {
        errors[path] = {
          type: issue.code,
          message: issue.message,
        } as FieldErrors<TFieldValues>[typeof path]
      }
    }

    return { values: {}, errors }
  }
}
