export type ProductProps = {
  id: string
  tenantId: string
  name: string
  description: string
  priceFullCents: number
  priceClubCents: number
  stock: number
  sku: string
  images: string[]
  active: boolean
  createdAt: Date
}

export class Product {
  private constructor(private readonly props: ProductProps) {}

  static create(props: ProductProps): Product {
    return new Product(props)
  }

  get id(): string {
    return this.props.id
  }

  get tenantId(): string {
    return this.props.tenantId
  }

  get name(): string {
    return this.props.name
  }

  get description(): string {
    return this.props.description
  }

  get priceFullCents(): number {
    return this.props.priceFullCents
  }

  get priceClubCents(): number {
    return this.props.priceClubCents
  }

  get stock(): number {
    return this.props.stock
  }

  get sku(): string {
    return this.props.sku
  }

  get images(): string[] {
    return this.props.images
  }

  get active(): boolean {
    return this.props.active
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  hasStockFor(qty: number): boolean {
    return this.props.stock >= qty
  }
}
