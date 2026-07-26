export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type OrderAddress = {
  zipCode: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
}

export type OrderItemProps = {
  id: string
  productId: string
  qty: number
  unitPriceCents: number
  discountPct: number
}

export type OrderProps = {
  id: string
  tenantId: string
  uid: string
  status: OrderStatus
  levelId: string | null
  items: OrderItemProps[]
  subtotalCents: number
  levelDiscountAmtCents: number
  cashbackUsedAmtCents: number
  shippingAmtCents: number
  totalCents: number
  asaasPaymentId: string | null
  trackingCode: string | null
  shippingLabelUrl: string | null
  address: OrderAddress
  createdAt: Date
}

export class Order {
  private constructor(private readonly props: OrderProps) {}

  static create(props: OrderProps): Order {
    return new Order(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get uid(): string {
    return this.props.uid
  }

  get status(): OrderStatus {
    return this.props.status
  }

  get levelId(): string | null {
    return this.props.levelId
  }

  get items(): OrderItemProps[] {
    return this.props.items
  }

  get subtotalCents(): number {
    return this.props.subtotalCents
  }

  get levelDiscountAmtCents(): number {
    return this.props.levelDiscountAmtCents
  }

  get cashbackUsedAmtCents(): number {
    return this.props.cashbackUsedAmtCents
  }

  get shippingAmtCents(): number {
    return this.props.shippingAmtCents
  }

  get totalCents(): number {
    return this.props.totalCents
  }

  get asaasPaymentId(): string | null {
    return this.props.asaasPaymentId
  }

  get trackingCode(): string | null {
    return this.props.trackingCode
  }

  get shippingLabelUrl(): string | null {
    return this.props.shippingLabelUrl
  }

  get address(): OrderAddress {
    return this.props.address
  }

  get createdAt(): Date {
    return this.props.createdAt
  }
}
