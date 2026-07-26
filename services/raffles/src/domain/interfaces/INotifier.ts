export interface INotifier {
  notifyRaffleWinner(
    uid: string,
    raffleTitle: string,
    ticketNumber: number,
  ): Promise<void>
}
