import {
  CredentialExchangeRecord as CredentialRecord,
  CredentialMetadataKeys,
  CredentialState,
  ProofExchangeRecord,
  ProofState,
} from '@aries-framework/core'
import { useCredentialByState, useProofByState } from '@aries-framework/react-hooks'
import { useStore } from 'aries-bifold'

import { CredentialMetadata, customMetadata } from 'aries-bifold/App/types/metadata'
import { getInvitationCredentialDate, showBCIDSelector } from '../helpers/BCIDHelper'
import { BCState } from '../store'

interface CustomNotification {
  type: 'CustomNotification'
  createdAt: Date
  id: string
}

interface Notifications {
  total: number
  notifications: Array<CredentialRecord | ProofExchangeRecord | CustomNotification>
}

export const useNotifications = (): Notifications => {
  const [store] = useStore<BCState>()
  const offers = useCredentialByState(CredentialState.OfferReceived)
  const proofs = useProofByState(ProofState.RequestReceived)
  const revoked = useCredentialByState(CredentialState.Done).filter((cred: CredentialRecord) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const metadata = cred!.metadata.get(CredentialMetadata.customMetadata) as customMetadata
    if (cred?.revocationNotification && metadata?.revoked_seen == undefined) {
      return cred
    }
  })

  const credentials = [
    ...useCredentialByState(CredentialState.CredentialReceived),
    ...useCredentialByState(CredentialState.Done),
  ]
  const credentialDefinitionIDs = credentials.map(
    (c) => c.metadata.data[CredentialMetadataKeys.IndyCredential].credentialDefinitionId as string
  )
  const invitationDate = getInvitationCredentialDate(credentials, true)
  const custom: CustomNotification[] =
    showBCIDSelector(credentialDefinitionIDs, true) &&
    invitationDate &&
    !store.dismissPersonCredentialOffer.personCredentialOfferDismissed
      ? [{ type: 'CustomNotification', createdAt: invitationDate, id: 'custom' }]
      : []

  const notifications = [...offers, ...proofs, ...revoked, ...custom].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return { total: notifications.length, notifications }
}
