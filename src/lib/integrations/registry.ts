export interface IntegrationEndpoint {
  system: "Jaguar" | "POS" | "JPL OMC"
  name: string
  method: "GET" | "POST"
  path: string
  purpose: string
}

/** Contract inventory for the integration layer. Status is live once each API is connected. */
export const INTEGRATION_ENDPOINTS: IntegrationEndpoint[] = [
  { system: "Jaguar", name: "Validate ticket", method: "POST", path: "/tickets/validate", purpose: "Only valid tickets proceed to fulfilment" },
  { system: "Jaguar", name: "Get ticket details", method: "GET", path: "/tickets/{ref}", purpose: "Authorised details shown on the POS" },
  { system: "Jaguar", name: "Get remaining balance", method: "GET", path: "/tickets/{ref}/balance", purpose: "Control partial redemption" },
  { system: "Jaguar", name: "Confirm redemption", method: "POST", path: "/redemptions/confirm", purpose: "Update Jaguar ticket status" },
  { system: "Jaguar", name: "Cancel redemption", method: "POST", path: "/redemptions/cancel", purpose: "Release entitlement on cancellation" },
  { system: "Jaguar", name: "Reverse redemption", method: "POST", path: "/redemptions/reverse", purpose: "Restore balance on approved reversal" },
  { system: "Jaguar", name: "Get customer & vehicle", method: "GET", path: "/customers/{id}/vehicles", purpose: "Validate redemption against vehicle" },
  { system: "Jaguar", name: "Get transaction history", method: "GET", path: "/transactions", purpose: "Reconciliation feed" },
  { system: "POS", name: "Device authentication", method: "POST", path: "/api/pos/auth", purpose: "Only authorised devices transact" },
  { system: "POS", name: "Submit OTP/QR", method: "POST", path: "/api/pos/tickets/validate", purpose: "Authenticate the ticket" },
  { system: "POS", name: "Receive ticket details", method: "GET", path: "/api/pos/tickets/{ref}", purpose: "Dealer verifies details" },
  { system: "POS", name: "Request authorisation", method: "POST", path: "/api/pos/transactions/authorise", purpose: "Fuelling only after all controls pass" },
  { system: "POS", name: "Submit completion", method: "POST", path: "/api/pos/transactions/{id}/complete", purpose: "Post the transaction" },
  { system: "POS", name: "Cancel incomplete", method: "POST", path: "/api/pos/transactions/{id}/cancel", purpose: "Release temporary authorisation" },
  { system: "POS", name: "Idempotent retry", method: "POST", path: "Idempotency-Key header", purpose: "Retries never duplicate a transaction" },
  { system: "JPL OMC", name: "Station status sync", method: "POST", path: "/onboarding/stations/sync", purpose: "Reflect station status back to JPL" },
  { system: "JPL OMC", name: "POS device management", method: "GET", path: "/devices", purpose: "JPL issues and manages terminals" },
]
