import { setRole } from '@clube/firebase-utils'

export class CreateSuperAdminUseCase {
  async execute(uid: string): Promise<void> {
    await setRole(uid, 'super_admin')
  }
}
