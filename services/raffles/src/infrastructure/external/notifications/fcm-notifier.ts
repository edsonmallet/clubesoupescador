import { getFirebaseApp } from '@clube/firebase-utils'
import { getMessaging } from 'firebase-admin/messaging'
import type { INotifier } from '../../../domain/interfaces/INotifier'

/**
 * No device ever registers an individual FCM token anywhere in this
 * codebase yet (see apps/pwa's useCheckout — same gap, documented there).
 * Sending to the per-user topic `user_<uid>` sidesteps that: once a client
 * subscribes its device to that topic (not implemented in the PWA yet
 * either), this send reaches it without the backend needing to store any
 * token. Until that subscription exists client-side, this call succeeds
 * (Firebase doesn't error on a topic with zero subscribers) but reaches
 * no one — a real notification target that just has no listeners yet,
 * not a fake success.
 */
export class FcmNotifier implements INotifier {
  async notifyRaffleWinner(
    uid: string,
    raffleTitle: string,
    ticketNumber: number,
  ): Promise<void> {
    await getMessaging(getFirebaseApp()).send({
      topic: `user_${uid}`,
      notification: {
        title: 'Você ganhou! 🎉',
        body: `Seu bilhete #${ticketNumber} foi sorteado em "${raffleTitle}"`,
      },
    })
  }
}
