import { StoreDetail } from '@/modules/stores/components/StoreDetail'

export default function LojaPage({ params }: { params: { id: string } }) {
  return <StoreDetail storeId={params.id} />
}
