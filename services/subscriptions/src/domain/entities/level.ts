export type LevelProps = {
  id: string
  name: string
  minXp: number
  storeDiscountPct: number
  cashbackPct: number
}

export class Level {
  private constructor(private readonly props: LevelProps) {}

  static create(props: LevelProps): Level {
    return new Level(props)
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get minXp(): number {
    return this.props.minXp
  }

  get storeDiscountPct(): number {
    return this.props.storeDiscountPct
  }

  get cashbackPct(): number {
    return this.props.cashbackPct
  }
}
