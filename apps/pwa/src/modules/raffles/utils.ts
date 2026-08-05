export const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function daysUntil(dateIso: string) {
  const diffMs = new Date(dateIso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-BR')
}
