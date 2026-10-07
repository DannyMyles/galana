# Prisma → Frappe model map

Working document for removing Prisma from the Galana portal, with Frappe as the data source.
Each of the 27 Prisma models is mapped to a Frappe doctype. Status:

- **Existing**: a Frappe doctype already holds this data.
- **Partial**: a doctype exists but covers only part of the model. The gap is noted.
- **New**: no Frappe equivalent. A doctype has to be created.
- **Decision**: the mapping depends on a choice you need to make (see the list at the end).

Frappe apps referenced: `jpl_fuel_card` (fuel card, POS devices, Galana Settings), `jpl_crm` (portal),
`erpnext` (customers, invoices, journal entries, payments).

## Identity & access

| Prisma model | Used for | Frappe equivalent | Status | Notes |
|---|---|---|---|---|
| `User` | Portal login, roles, station link | `User` | Existing | Login moves to Frappe sessions. `status` maps to `enabled`. `station` needs a custom link field (see Station). |
| `Role` | RBAC role catalogue | `Role` | Existing | `RoleName` values become Frappe roles (see enums below). |
| `UserRole` | User ↔ role join | `User.roles` child table | Existing | Frappe stores this in `Has Role`. No new doctype. |
| `AuditLog` | Every action, before/after values | `Version` (per-document changes) + a new doctype for portal actions | Partial | `Version` records document field changes but not "who did what from where". Portal actions (approvals, resolutions, IP, device) need a new `Galana Audit Log`. **Decision 3.** |

## Station, dealer & devices

| Prisma model | Used for | Frappe equivalent | Status | Notes |
|---|---|---|---|---|
| `Dealer` | Station owner, settlement account | `Fuel Partner Management` (the station operator: contacts, KYC, `supplier` link for settlement) | Existing | Reused. Checked in `fuel_card.py` (`get_fuel_partners_with_stations`): this is the network Jaguar customers fuel at. |
| `Station` | Fuel station: code, location, JPL sync, status | `Fuel Partner Station` (child table of Fuel Partner Management): name, `station_id` (code), `pts_id`, address, region, lat/lng, contacts, pumps | Partial | Reused. Gaps: county, station status (partner `workflow_state` covers the partner, not each station), JPL sync status. Add as fields on the child table. |
| `FuelProduct` | Product catalogue (PMS, AGO, Lubricants, Other) | `Item` (filter by `custom_item_category` / Fuel Card Price items) | Partial | Fuel items already exist in ERPNext. Confirm the four Galana codes map to existing items. |
| `StationProduct` | Which products a station sells | none | New | Child table on the new Station doctype. |
| `EpraPrice` | Price per litre, effective dates | `Galana EPRA Price Item` (child of `Galana Settings`) | Existing | Already built. Galana Settings is the single source for EPRA prices. |
| `POSDevice` | Device ID, station, software version, status | `POS Device Management` (+ `POS Device Movement`: `station` links to Fuel Partner Station) | Partial | Device and allocation exist. Missing: `software_version` and `last_seen_at` (add as fields). The station comes from the allocated movement row. Approved versions are in `Galana Approved POS Software`. |
| `ApprovedSoftwareVersion` | Approved POS software | `Galana Approved POS Software` (child of `Galana Settings`) | Existing | Already built. |

## Customer, vehicle & ticketing

| Prisma model | Used for | Frappe equivalent | Status | Notes |
|---|---|---|---|---|
| `Customer` | Jaguar account, tier, Jaguar ref | `Customer` | Existing | `jaguarRef` → Customer ID or a custom field. `tier` → custom field or Customer Group. |
| `Vehicle` | Registration per customer | `Fuel Card Vehicle` | Existing | Holds `vehicle_number`, `fuel_card_account`, limits and approval status. |
| `Ticket` | Jaguar fuel ticket: quantity, OTP, expiry, status | `Fuel Card Transaction Log` with `transaction_type = Fuel Authorization` | Partial | Frappe tracks `authorization_status` (Reserved, Dispensing, Consumed, Expired, Refunded). Galana's `ticketNo`, `otpHash`, `qrCodeToken` and `remainingQuantityL` have no field. **Decision 2.** |
| `TicketValidation` | Each OTP/QR validation attempt | `Fuel Card Transaction Log` (validation rows) or `Jaguar OTP Logger` | Partial | `jpl_otp_logger` exists for OTP. QR validation has no record. |

## Funding & wallet

| Prisma model | Used for | Frappe equivalent | Status | Notes |
|---|---|---|---|---|
| `FuelWallet` | Jaguar prepaid balance per customer | `Fuel Card Account` (prepaid) + GL receivable balance | Partial | The balance is derived from the GL, not stored. `balance` in Prisma becomes a computed value. |
| `WalletTopUpRequest` | Top-up request, maker/checker | `jpl_fuel_card_top_up` | Partial | Confirm the doctype covers maker/checker states. |
| `PrepaidReceipt` | Confirmed gross funding | `Payment Entry` (received from the customer) | Existing | ERPNext already posts this. Link the Payment Entry to the top-up. |
| `ManualAdjustment` | Wallet credit/debit adjustment, maker/checker | `Journal Entry` (draft until approved) | Partial | Needs a maker/checker workflow on Journal Entry, or a new doctype. |

## Transactions & settlement

| Prisma model | Used for | Frappe equivalent | Status | Notes |
|---|---|---|---|---|
| `Transaction` | One fuelling event: quantities, tariff, status, idempotency key | `Fuel Card Transaction Log` (`Successful Fueling` / `Fueling Attempt`) | Partial | Frappe has the POS fields (`pts_id`, `transaction_number`). Missing: `idempotencyKey`, `unitTariff` snapshot, `completedAt`. |
| `TransactionEvent` | State change history | `Version` on `Fuel Card Transaction Log` | Partial | Same gap as `AuditLog`. |
| `TransactionReversal` | Reversal request, approval | none | New | Financial posting rules are still open (requirements §15/16). |
| `DealerSettlement` | Gross, discounts, net payable to dealer | none | New | Needs the dealer model first. **Decision 1.** |
| `CreditNote` | Discount credit notes, maker/checker | `Sales Invoice` (return) / `Credit Note` in ERPNext | Partial | `UNDER_CANOPY` and `CONTRACTUAL` types are custom. |

## Settings

| Prisma model | Used for | Frappe equivalent | Status | Notes |
|---|---|---|---|---|
| `SystemSetting` | Key/value portal settings (e.g. validity minutes) | `Galana Settings` (single) | Partial | Add a field per setting that the portal reads. Check which keys exist in the database before migrating. |

## Reconciliation & exceptions

| Prisma model | Used for | Frappe equivalent | Status | Notes |
|---|---|---|---|---|
| `ReconciliationRecord` | Matched/exception per level | none | New | The Jaguar ticket feed (`ticket_reconciliation`) is already available as the source for ticket level. |
| `ExceptionQueueItem` | Open differences to investigate | none | New | |

## Enums

| Prisma enum | Frappe equivalent |
|---|---|
| `RoleName` (SYSTEM_ADMIN, FINANCE_MAKER, FINANCE_CHECKER, OPS_FUEL_CARD, STATION_DEALER_MANAGER, JAGUAR_CUSTOMER, INTERNAL_AUDITOR) | Frappe `Role` records |
| `UserStatus`, `StationStatus`, `POSStatus`, `TopUpStatus`, `ReversalStatus`, `CreditNoteStatus`, `SettlementStatus`, `ExceptionStatus`, `ReconciliationStatus`, `ReconciliationLevel` | Select fields on the matching doctype |
| `TicketStatus` | `Fuel Card Transaction Log.authorization_status` (see the status map in `partner/service.py`) |
| `TransactionStatus` (12 values) | Needs a decision: the Frappe statuses are fewer. Map or extend. |
| `FuelProductCode` (PMS, AGO, LUBRICANTS, OTHER) | `Item` codes |
| `CreditNoteType`, `AdjustmentDirection`, `ValidationMode`, `JplSyncStatus`, `AuditResult` | Select fields |

## Decisions (answered)

1. **Stations and dealers:** new Galana doctypes (`Galana Station`, `Galana Dealer`, with `StationProduct` as a child table).
2. **Tickets:** Galana reads the tickets generated in the fuel card portal (`jpl_crm/www/fuel_card.py`, backed by `Fuel Card Transaction Log`). The Prisma `Ticket` model is dropped. Ticket lists come from `ticket_reconciliation` and single tickets from `ticket_status`.
3. **Audit:** revised. Use Frappe's core `Activity Log` instead of a new doctype. It has the fields the portal needs: user and full name, action (`subject`), status, timestamp, IP, and the record it touched (`reference_doctype` / `reference_name`). Old and new values and the device go in `content`. Impact: (a) Frappe clears Activity Log after 90 days by default, so retention must be raised in Log Settings or the history is lost; (b) Frappe's System Manager role can edit and delete entries, so the portal's "immutable" guarantee needs permissions locked down; (c) the log also holds Frappe's own login and view entries, so portal entries need filtering by `reference_doctype`. A new doctype is only worth it if the immutability guarantee must be enforced in code. (d) `operation` only accepts Login, Logout and Impersonate, so portal action names such as `STATION_CREATED` go in `subject`, and `operation` stays empty for portal actions. `status` (Success, Failed) fits the portal's result field as it is.
4. **Transaction status:** `Fuel Card Transaction Log` covers part of the Galana lifecycle. Mapping:

   | Galana `TransactionStatus` | Frappe equivalent |
   |---|---|
   | INITIATED, TICKET_VALIDATED, FUEL_AUTHORISATION_PENDING | not recorded (before authorisation) |
   | AUTHORISED | `authorization_status` = Reserved |
   | FUELLING_IN_PROGRESS | `authorization_status` = Dispensing |
   | COMPLETED | `authorization_status` = Consumed, `transaction_status` = Success |
   | FAILED, REJECTED | `transaction_status` = Failed |
   | CANCELLED | `authorization_status` = Refunded |
   | EXPIRED | `authorization_status` = Expired |
   | REVERSED | no status |
   | PENDING_RECONCILIATION | no status |

   Added to `Fuel Card Transaction Log.authorization_status` as `Reversed` and `Pending Reconciliation` (reloaded on `crm`). No posting logic uses them yet.
5. **Financial posting:** stays blocked. Reversals, dealer settlements and credit notes are not built.


## Step 2 status: login

- Passwords and portal roles are checked in Frappe through the partner service account (`portal_login`, `portal_profile` in `jpl_fuel_card/api/partner`). Roles are Frappe Roles named `Galana <RoleName>`.
- `src/auth.ts` no longer reads `passwordHash`. The Prisma row is still looked up by email for the session id. That lookup goes in step 3.
- Each session check calls `portal_profile`, so a disabled user loses access on the next check. If Frappe can't be reached, the session ends (fails closed).
- Only one test user exists in Frappe so far: `admin@galana.co.ke` (role `Galana SYSTEM_ADMIN`). Other seeded users need Frappe users before they can sign in.

## Migration progress

- Step 1, fuel tickets: Frappe list endpoint `partner.v1.tickets` (search, status, paging) added and tested. The Galana client call `listTickets` is added. The fuel tickets page still reads Prisma.
- Stations and POS devices: reuse `Fuel Partner Management` / `Fuel Partner Station` and `POS Device Management` / `POS Device Movement`. Only fields are added, no new doctypes.
- Customer scope: `Galana Settings.galana_customers` (child table `Galana Customer`, currently Jaguar Petroleum on `crm`) lists the customers the partner API returns. Other customers get "not found", the same as a missing one. The ticket list is filtered to that customer's fuel card accounts. Assumption: Jaguar Petroleum Limited's own customers are separate Customer records. If they are sub-accounts of Jaguar Petroleum instead, this gate would not hide them.
- Stations, POS devices, approved software, dealers (edit only): moved to Frappe. Data layer, actions, detail pages and audit now call `partner.v1` endpoints. Dealer creation stays in the Frappe onboarding workflow. Station transactions and users on the detail pages are empty until transactions and users move.
- Audit: `writeAuditLog` writes to Frappe Activity Log, with the signed-in user's email as the actor.
- Stations and dealers do not use Fuel Partner Management. The Jaguar fleet flow depends on it, so it is left as it was. Galana uses two new doctypes: `Galana Dealer` and `Galana Station` (the station's dealer is a Galana Dealer). The POS Device Movement `omc` and `station` links point at these. The fields that were briefly added to Fuel Partner Station and Fuel Partner Management are reverted.
- Open impact: the Jaguar POS device API (`api/pos_device_management.py`) resolves station names from Fuel Partner Station, so it won't name Galana stations. A ticket's fuel station comes from the Jaguar flow (Fuel Partner Station), so a device allocated to a Galana station can't fuel a Jaguar ticket at a different station. Decision needed: are Galana stations the same physical stations as the Jaguar fuel partner stations?
- EPRA prices: the page, data layer and actions read and write Galana Settings through the partner API (`epra_price_history`, `add_epra_price`). A new price closes the previous one the day before. The Jaguar `epra_prices` endpoint reads the same table.
- Ticket monitoring: the fuel tickets list and detail pages read from the fuel card service (`tickets`, `ticket_status`). Amounts are in shillings, so the table shows authorised and consumed amounts instead of litres. The audit panel on every detail page reads Activity Log (`record_audit`), so it no longer uses Prisma.
- Audit log page and CSV export: read from Activity Log (`partner.v1.audit_log`), filtered by user, action, entity, result, date range and preset. Portal entries are the ones with an entity in their content, so Frappe's own login entries are left out.
- Users, roles and passwords: Frappe users with `Galana <RoleName>` roles. The station for dealer managers is the custom field `User.galana_station`. Status maps to enabled (Suspended is no longer offered, because Frappe has no third state). Setup and reset use Frappe's own emails, so no password is shown in the portal.

## Prisma removed

- `prisma/`, the database client, the Prisma and `pg` packages, and `bcryptjs` are removed from the project. `npx next build` passes.
- Moved to Frappe: users and roles, stations, dealers, POS devices, approved software, EPRA prices, portal settings (limits and discounts on Galana Settings), the audit log and its CSV export, the fuel tickets list and detail, the Jaguar ticket views, and the Jaguar customer summary.
- Not available yet (placeholders, no data stored): adjustments, credit notes, reversals, dealer settlements, funding wallet and top-ups, failed transactions (exceptions), reconciliation records, dispensing, the Galana OTP/QR validation flow, transactions, dashboard, reports, and the customer list and detail. Each one needs a Frappe build before it can come back.
- The session id is the user's email, read from Frappe. `portal_profile` is checked on every session.
- Transactions: the list and detail read the fuel card transaction log (`partner.v1.transactions`, `transaction`), limited to Galana customers. Completed is a successful fuelling; failed is a failed attempt or fuelling. The list has search, status and date filters with paging.
- Customers, dashboard and reports: `partner.v1.portal_customers`, `portal_customer`, `portal_dashboard`, `portal_report`. Scope is decided in Frappe from the signed-in user's roles. Admin, ops, finance, auditor and Jaguar see all Galana customers. A dealer manager sees only their station (`User.galana_station`), and no customer accounts. Fuelling is attributed to a station through the POS device: `pts_id` is assumed to be the device serial. Funding, settlement, dealer credit and reconciliation figures are reported as unavailable.
- JPL OMC sync: not needed. No outbound call will be built. Stations keep their `jpl_sync_status` field, which is set to PENDING on changes but never sent anywhere.
- Test data on `crm` (for screen checks only, no ledger postings): stations `TEST-ST-01` and `TEST-ST-02` under `TEST Dealer`; POS devices `TEST-POS-0001` to `0003`; vehicles `KTEST 001` to `003`; 30 completed fuellings, 3 failed attempts (all with `notes` = "TEST DATA"); tickets `TEST-TKT-*`. Remove with the TEST names and `notes = "TEST DATA"`.
- Wallet top-ups (approval only): `Galana Top Up Request` doctype, with `partner.v1.topups`, `create_topup`, `decide_topup`. Makers create requests; checkers approve or reject, never their own; a rejection needs a reason. Approval is recorded but NOT posted to the ledger, so no balance changes yet. Posting is added when the financial posting rules are settled.
- Manual adjustments: `Galana Adjustment` doctype with maker-checker approval. An approved credit adds to the fuel wallet and an approved debit takes from it (see service.get_customer_float). No bank account or journal entry is involved.
- Reversals: `Galana Reversal` doctype with maker-checker approval, one open request per fuelling. Approval is recorded but does NOT change the wallet yet (question 5 is still open).
- Dealer settlements (PROVISIONAL): one line per completed fuelling, using the under-canopy and Jaguar discount percentages from Galana Settings. Net to dealer = gross - under-canopy - Jaguar. Status PENDING, nothing posted. Formula to be confirmed (questions 1 to 3).
- Jaguar partner account: role `Jaguar Partner API`. It can call only `login`, `refresh_token`, `logout`, `customer_float`, `epra_prices` and `transaction_events`. Every other partner endpoint is Galana-only and refuses it with 403. Brian's real account is not created yet: it needs his email.
- POS terminal account: role `POS Partner API`. It can call `ticket_status`, `validate_ticket`, `pos_device`, `authorise`, `start_fuelling`, `request_otp`, `confirm_otp`, `cancel_transaction`, plus the shared `transaction_events`, `epra_prices` and `customer_float`. Portal endpoints are refused.
- Reversals: an approved reversal gives the fuelling amount back to the Jaguar fuel wallet (decided by the manager). Pending reversals change nothing.
- Settlements and credit notes (decided): discounts are KES per litre (Galana Settings). Under-canopy discount = litres x rate, deducted from the dealer's net payable and raised as a credit note to Jaguar. Jaguar contractual discount = litres x rate, raised as a credit note only (not deducted from the dealer). Rates start at 0 until Galana sets them. Credit notes are PENDING and nothing is posted.
