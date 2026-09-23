export interface IntegrationEndpoint {
  story: string
  system: "Jaguar" | "POS" | "JPL OMC"
  name: string
  method: "GET" | "POST"
  path: string
  purpose: string
}

/** Contract inventory for the integration layer. Status is live once each API is connected. */
export const INTEGRATION_ENDPOINTS: IntegrationEndpoint[] = [
  { story: "US-INT-001", system: "Jaguar", name: "Validate ticket", method: "POST", path: "/tickets/validate", purpose: "Only valid tickets proceed to fulfilment" },
  { story: "US-INT-002", system: "Jaguar", name: "Get ticket details", method: "GET", path: "/tickets/{ref}", purpose: "Authorised details shown on the POS" },
  { story: "US-INT-003", system: "Jaguar", name: "Get remaining balance", method: "GET", path: "/tickets/{ref}/balance", purpose: "Control partial redemption" },
  { story: "US-INT-004", system: "Jaguar", name: "Confirm redemption", method: "POST", path: "/redemptions/confirm", purpose: "Update Jaguar ticket status" },
  { story: "US-INT-005", system: "Jaguar", name: "Cancel redemption", method: "POST", path: "/redemptions/cancel", purpose: "Release entitlement on cancellation" },
  { story: "US-INT-006", system: "Jaguar", name: "Reverse redemption", method: "POST", path: "/redemptions/reverse", purpose: "Restore balance on approved reversal" },
  { story: "US-INT-007", system: "Jaguar", name: "Get customer & vehicle", method: "GET", path: "/customers/{id}/vehicles", purpose: "Validate redemption against vehicle" },
  { story: "US-INT-008", system: "Jaguar", name: "Get transaction history", method: "GET", path: "/transactions", purpose: "Reconciliation feed" },
  { story: "US-POS-001", system: "POS", name: "Device authentication", method: "POST", path: "/api/pos/auth", purpose: "Only authorised devices transact" },
  { story: "US-POS-002", system: "POS", name: "Submit OTP/QR", method: "POST", path: "/api/pos/tickets/validate", purpose: "Authenticate the ticket" },
  { story: "US-POS-003", system: "POS", name: "Receive ticket details", method: "GET", path: "/api/pos/tickets/{ref}", purpose: "Dealer verifies details" },
  { story: "US-POS-004", system: "POS", name: "Request authorisation", method: "POST", path: "/api/pos/transactions/authorise", purpose: "Fuelling only after all controls pass" },
  { story: "US-POS-005", system: "POS", name: "Submit completion", method: "POST", path: "/api/pos/transactions/{id}/complete", purpose: "Post the transaction" },
  { story: "US-POS-006", system: "POS", name: "Cancel incomplete", method: "POST", path: "/api/pos/transactions/{id}/cancel", purpose: "Release temporary authorisation" },
  { story: "US-POS-007", system: "POS", name: "Idempotent retry", method: "POST", path: "Idempotency-Key header", purpose: "Retries never duplicate a transaction" },
  { story: "US-ADM-005", system: "JPL OMC", name: "Station status sync", method: "POST", path: "/onboarding/stations/sync", purpose: "Reflect station status back to JPL" },
  { story: "US-ADM-006", system: "JPL OMC", name: "POS device management", method: "GET", path: "/devices", purpose: "JPL issues and manages terminals" },
]
