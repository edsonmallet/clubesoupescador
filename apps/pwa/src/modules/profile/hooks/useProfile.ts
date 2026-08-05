'use client'

import { getFirebaseAuth } from '@/shared/services/firebase'
import { useQuery } from '@tanstack/react-query'
import { profileService } from '../services/profile.service'

export function useProfile() {
  const query = useQuery({
    queryKey: ['profile-stats'],
    queryFn: () => profileService.getStats(),
  })

  const currentUser = getFirebaseAuth().currentUser

  return {
    ...query,
    name: currentUser?.displayName ?? 'Pescador(a)',
    email: currentUser?.email ?? '',
  }
}
