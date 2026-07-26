import type { Ticket, TicketSource, TicketStatus } from '../entities/Ticket'

export type AllocateTicketsDto = {
  tenantId: string
  raffleId: string
  uid: string
  qty: number
  source: TicketSource
  status: TicketStatus
  asaasPaymentId: string | null
}

export interface ITicketRepository {
  /**
   * Allocates `qty` sequential ticket numbers atomically — the next number
   * is `max(number) + 1` computed inside the same transaction as the
   * inserts, so two concurrent joins never get the same ticket number.
   */
  allocate(data: AllocateTicketsDto): Promise<Ticket[]>
  findByUidAndRaffle(
    tenantId: string,
    raffleId: string,
    uid: string,
  ): Promise<Ticket[]>
  hasJoinedBySource(
    tenantId: string,
    raffleId: string,
    uid: string,
    source: TicketSource,
  ): Promise<boolean>
  findConfirmedByRaffle(tenantId: string, raffleId: string): Promise<Ticket[]>
  confirmByAsaasPaymentId(asaasPaymentId: string): Promise<Ticket[]>
}
