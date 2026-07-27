import type { AsaasClient } from '@clube/asaas-sdk'
import type { Ticket } from '../../domain/entities/Ticket'
import { RaffleClosedError, RaffleNotFoundError } from '../../domain/errors'
import type { IRaffleRepository } from '../../domain/interfaces/IRaffleRepository'
import type { ITicketRepository } from '../../domain/interfaces/ITicketRepository'

export type BuyTicketsInput = {
  uid: string
  tenantId: string
  raffleId: string
  qty: number
}

export type BuyTicketsOutput = {
  tickets: Ticket[]
  paymentUrl: string | null
}

export class BuyTicketsUseCase {
  constructor(
    private readonly raffleRepository: IRaffleRepository,
    private readonly ticketRepository: ITicketRepository,
    private readonly asaasClient: AsaasClient,
  ) {}

  async execute(input: BuyTicketsInput): Promise<BuyTicketsOutput> {
    const raffle = await this.raffleRepository.findById(
      input.tenantId,
      input.raffleId,
    )
    if (!raffle) throw new RaffleNotFoundError(input.raffleId)
    if (!raffle.isOpen()) throw new RaffleClosedError(raffle.id)

    // Reuses the Asaas customer created during the member's subscription
    // checkout (externalReference = uid) — same approach as store's orders,
    // no need to collect name/cpfCnpj again here.
    const customer = await this.asaasClient.findCustomerByExternalReference(
      input.uid,
    )

    let paymentUrl: string | null = null
    let asaasPaymentId: string | null = null
    if (customer) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)

      const payment = await this.asaasClient.createPayment({
        customer: customer.id,
        billingType: 'UNDEFINED',
        value: (raffle.ticketPriceCents * input.qty) / 100,
        dueDate: dueDate.toISOString().slice(0, 10),
      })
      asaasPaymentId = payment.id
      paymentUrl = payment.invoiceUrl ?? payment.bankSlipUrl ?? null
    }

    const tickets = await this.ticketRepository.allocate({
      tenantId: input.tenantId,
      raffleId: raffle.id,
      uid: input.uid,
      qty: input.qty,
      source: 'purchase',
      status: 'pending',
      asaasPaymentId,
      maxTickets: raffle.maxTickets,
    })

    return { tickets, paymentUrl }
  }
}
