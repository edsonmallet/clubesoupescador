const BASE_URL = 'https://servicebus2.caixa.gov.br/portaldeloterias/api'

export type LoteriaFederalResult = {
  contestNumber: number
  drawnNumbers: string[]
}

export class LoteriaFederalClient {
  async getResult(contestNumber: number): Promise<LoteriaFederalResult> {
    const response = await fetch(`${BASE_URL}/federal/${contestNumber}`)

    if (!response.ok) {
      throw new Error(
        `Loteria Federal API error: ${response.status} ${response.statusText}`,
      )
    }

    const body = (await response.json()) as {
      numero: number
      listaDezenas: string[]
    }

    return { contestNumber: body.numero, drawnNumbers: body.listaDezenas }
  }
}
