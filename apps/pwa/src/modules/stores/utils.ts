export function formatMemberSince(dateIso: string) {
  return new Date(dateIso).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}
