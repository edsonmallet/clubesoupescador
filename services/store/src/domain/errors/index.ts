import { DomainError } from './domain-error'

export class ProductNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Product ${id} not found`, 'PRODUCT_NOT_FOUND', 404)
  }
}

export class OutOfStockError extends DomainError {
  constructor(id: string) {
    super(`Product ${id} is out of stock`, 'OUT_OF_STOCK', 409)
  }
}

export class OrderNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Order ${id} not found`, 'ORDER_NOT_FOUND', 404)
  }
}

export { DomainError }
