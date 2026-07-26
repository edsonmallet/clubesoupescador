'use client'

import { Button, Input } from '@clube/ui'
import { useCategories } from '../hooks/useCategories'
import { useCreateTopic } from '../hooks/useCreateTopic'

export function NewTopicForm() {
  const { data: categories } = useCategories()
  const { form, mutation, onSubmit } = useCreateTopic()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Categoria
        </label>
        <select
          id="categoryId"
          {...register('categoryId')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <span className="text-sm text-red-600">
            {errors.categoryId.message}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Título
        </label>
        <Input id="title" {...register('title')} />
        {errors.title && (
          <span className="text-sm text-red-600">{errors.title.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="body" className="text-sm font-medium">
          Conteúdo
        </label>
        <textarea
          id="body"
          rows={6}
          {...register('body')}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.body && (
          <span className="text-sm text-red-600">{errors.body.message}</span>
        )}
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600">
          Não foi possível publicar o tópico.
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Publicando...' : 'Publicar'}
      </Button>
    </form>
  )
}
