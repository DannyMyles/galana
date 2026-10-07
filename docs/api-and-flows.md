# Galana fuel card integration: API test guide and flows

Base URL: `https://<site>/api/method/jpl_fuel_card.api.partner.v1.<name>` (on the dev box: `http://127.0.0.1:8000` with `Host: crm`).

Every response is wrapped as `{"message": ...}`. Login returns `{"user", "tokens", "message"}` at the top level. Errors return `{"exception": "...", "_server_messages": "..."}` with a 4xx or 5xx status. The readable text is inside `_server_messages`.

---

## 1. Accounts and roles

| Account | Frappe role | Can call |
|---|---|---|
| Galana service account (`galana.partner.api@galana.co.ke`) | `Galana Partner API` | Everything |
| Jaguar (Brian) | `Jaguar Partner API` | `login`, `refresh_token`, `logout`, `customer_float`, `epra_prices`, `transaction_events` |
| POS terminal | `POS Partner API` | `login`, `refresh_token`, `logout`, `ticket_status`, `validate_ticket`, `pos_device`, `authorise`, `start_fuelling`, `request_otp`, `confirm_otp`, `cancel_transaction`, `transaction_events`, `epra_prices`, `customer_float` |
| Portal staff | `Galana <RoleName>` (e.g. `Galana FINANCE_MAKER`) | Galana portal endpoints (section 4) |

Anything outside an account's list returns **403**. A missing or bad token returns **401**.

---

## 2. Authentication

**Login** (no token needed):

```bash
curl -X POST "$BASE/login" -H "Content-Type: application/json" \
  -d '{"usr": "<username>", "pwd": "<password>"}'
```

Response:

```json
{
  "user": {"name": "...", "full_name": "...", "email": "..."},
  "tokens": {"access_token": "...", "refresh_token": "...", "expires_in": 3600},
  "message": "Logged in successfully"
}
```

Send `Authorization: Bearer <access_token>` on every other call. Tokens expire after 3600 seconds.

**Refresh** (rotates the tokens; the old one is revoked):

```bash
curl -X POST "$BASE/refresh_token" -H "Content-Type: application/json" -d '{"refresh_token": "<refresh>"}'
```

**Logout** (revokes the access token):

```bash
curl -X GET "$BASE/logout" -H "Authorization: Bearer <access_token>"
```

**Signed POSTs (`transaction_events` only)** also need:

- `X-Client-Id`: the client id from the OAuth Client record.
- `X-Timestamp`: unix seconds. Must be within 300 seconds of server time.
- `X-Signature`: `sha256=` + HMAC-SHA256 of `"<X-Timestamp>." + raw body`, keyed with the client secret.

---

## 3. Jaguar endpoints (Brian)

These are the only partner endpoints Jaguar may call.

### 3.1 `customer_float`: is there enough float?

```bash
curl -G "$BASE/customer_float" -H "Authorization: Bearer $T" \
  --data-urlencode "customer=Jaguar Petroleum" --data-urlencode "amount=5000"
```

Response:

```json
{"message": {"customer": "Jaguar Petroleum", "payment_type": "Prepaid", "account_status": "Active",
  "currency": "KES", "as_of": "2026-10-06", "required_amount": 5000.0,
  "float_balance": 0.0, "available": 0.0, "sufficient": false}}
```

- Prepaid accounts return `float_balance`. Credit accounts return `credit_limit`, `utilized_credit` and `available_credit`.
- `sufficient` is `true` when `available` covers `amount`.
- Other customers return **404** ("Customer X not found").

### 3.2 `epra_prices`: current prices

```bash
curl -G "$BASE/epra_prices" -H "Authorization: Bearer $T" --data-urlencode "product=Automotive Gasoil Local Lot Costed (Litre)"
```

Response:

```json
{"message": {"as_of": "2026-10-06", "prices": [
  {"product": "Automotive Gasoil Local Lot Costed (Litre)", "price_per_litre": 214.0,
   "currency": "KES", "effective_from": "2026-10-06", "effective_to": null}]}}
```

`product` is optional. With no active price the call returns **404**.

### 3.3 `transaction_events`: push a completed fuelling (signed)

```bash
BODY='{"ticketReference":"<ticket name>","authorizationCode":"12345678","ptsId":"TEST-POS-0002",
"transactionNumber":"TX-0001","transactionDateTime":"2026-10-06 10:15:00","amount":5000,
"volume":23.25,"price":214,"pumpNumber":1,"nozzleNumber":2}'
TS=$(date +%s)
SIG="sha256=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$CLIENT_SECRET" | awk '{print $2}')"
curl -X POST "$BASE/transaction_events" -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -H "X-Client-Id: $CLIENT_ID" -H "X-Timestamp: $TS" -H "X-Signature: $SIG" -d "$BODY"
```

- Required: `ptsId`, `transactionNumber`, `transactionDateTime`, `amount`, and `ticketReference` or `authorizationCode`.
- Optional: `volume`, `price`, `totalVolume`, `totalAmount`, `pumpNumber`, `nozzleNumber`, `tagNo`, `clockNo`, `shiftNo`, `customerPin`, `customerName`.
- Sending the same `ptsId` and `transactionNumber` again is recognised as a duplicate and is not counted twice.
- A wrong or missing signature returns **401**. A timestamp outside 300 seconds returns **401**.

---

## 4. POS endpoints

The POS calls these in order for one fuelling.

| Step | Endpoint | Method | Purpose |
|---|---|---|---|
| 1 | `pos_device` | GET | Device active, on an allocated station, on approved software |
| 2 | `validate_ticket` | GET | Ticket valid to fuel? Read-only, does not use the ticket |
| 3 | `authorise` | POST | Reserve the fuel (only if the POS requests it) |
| 4 | `start_fuelling` | POST | Ticket moves from Reserved to Dispensing |
| 5 | `transaction_events` | POST | Record the completed fuelling (signed) |
| - | `cancel_transaction` | POST | Cancel a ticket that has not started fuelling |

Example checks:

```bash
curl -G "$BASE/pos_device" -H "Authorization: Bearer $T" --data-urlencode "serial_number=TEST-POS-0002" --data-urlencode "software_version=TEST-1.0"
curl -G "$BASE/validate_ticket" -H "Authorization: Bearer $T" --data-urlencode "authorization_code=12345678"
curl -X POST "$BASE/start_fuelling" -H "Authorization: Bearer $T" -H "Content-Type: application/json" \
  -d '{"pos_serial":"TEST-POS-0002","software_version":"TEST-1.0","authorization_code":"12345678"}'
```

`validate_ticket` response: `{"valid": true, "reason": null, "ticket_reference": "...", "status": "Reserved", "portal_status": "Approved", "customer": "...", "vehicle_number": "...", "fuel_type": "Diesel", "authorised_amount": 5000.0, "remaining_amount": 5000.0, "expires_on": "..."}`.

`pos_device` refusals: "POS device is deactivated", "not allocated to a station", "Software version X is not approved" (403 or 417 depending on the check).

`authorise` takes `customer`, `vehicle_id`, `fuel_amount` and optional `fuel_station`. It returns the 8-digit code, the expiry, the vehicle and the driver. It is refused with "Insufficient float" when the wallet is short.

`cancel_transaction` takes `ticket_reference` or `authorization_code` and a `reason`. Only Reserved tickets can be cancelled.

OTP calls: `request_otp` takes `vehicle_id` and `id_number`. `confirm_otp` takes `otp` and `id_number`.

---

## 5. Galana portal endpoints (internal)

These need the Galana service account, and an `actor` (the signed-in user's email) for writes. The portal calls them; they are not for external use.

| Area | Endpoints |
|---|---|
| Customers | `galana_customers`, `portal_customers`, `portal_customer` |
| Dashboard and reports | `portal_dashboard`, `portal_report` |
| Tickets and transactions | `tickets`, `ticket_status`, `transactions`, `transaction`, `ticket_reconciliation`, `customer_summary`, `customer_consumption`, `audit_trail` |
| Stations, dealers, devices | `stations`, `station`, `save_station`, `set_station_status`, `dealers`, `dealer`, `update_dealer`, `pos_devices`, `pos_device_record`, `create_pos_device`, `set_pos_device_status`, `fuel_products` |
| Software and EPRA | `approved_versions`, `add_approved_version`, `remove_approved_version`, `epra_price_history`, `add_epra_price` |
| Wallet | `topups`, `create_topup`, `decide_topup` |
| Adjustments | `adjustments`, `create_adjustment`, `decide_adjustment` |
| Reversals | `reversals`, `create_reversal`, `decide_reversal` |
| Settlements | `settlements`, `credit_notes` |
| Users | `portal_users`, `portal_user`, `create_portal_user`, `update_portal_user`, `set_portal_user_status`, `reset_portal_user_password`, `portal_login`, `portal_profile` |
| Settings and audit | `portal_settings`, `save_portal_settings`, `audit`, `record_audit`, `audit_log` |
| Vehicles | `vehicle_details` |

Example, a wallet top-up (maker creates, checker decides):

```bash
curl -X POST "$BASE/create_topup" -H "Authorization: Bearer $G" -H "Content-Type: application/json" \
  -d '{"actor":"finance.maker@galana.co.ke","customer":"Jaguar Petroleum","amount":25000,
       "funding_account":"KES 1234567890 (Jaguar)","reference":"TEST TOPUP 9"}'
curl -X POST "$BASE/decide_topup" -H "Authorization: Bearer $G" -H "Content-Type: application/json" \
  -d '{"actor":"finance.checker@galana.co.ke","request_id":"<id>","decision":"Approved"}'
```

Rules enforced on the server: the maker can't decide their own request; a rejection needs a reason; a decided request can't be decided again; the customer must be a Galana customer.

---

## 6. Flows

### 6.1 Fuel ticket lifecycle

```
authorise (Reserved, code issued)
   |-- cancel_transaction --> Refunded (Cancelled)
   |-- expiry time passes -->  Expired
   |-- start_fuelling -------> Dispensing (Fuelling)
            |-- transaction_events --> Consumed (Fulfilled), fuelling row Success
```

`validate_ticket` and `ticket_status` only read. Verifying a code in the Jaguar portal does not change its status.

### 6.2 POS fuelling

```
POS -> pos_device            device active, allocated, approved software?
POS -> validate_ticket       valid? (read-only)
POS -> start_fuelling        Reserved -> Dispensing
POS -> transaction_events    signed; records litres and amount; ticket Consumed
```

### 6.3 Wallet balance (the one formula)

```
balance = approved top-ups
        + approved credit adjustments
        - approved debit adjustments
        + approved reversals (the fuelling amount goes back)
        - successful fuelling
```

Pending and rejected requests change nothing. Used by `customer_float`, `authorise`, the dashboard and customer pages.

### 6.4 Approvals (top-ups, adjustments, reversals)

```
Maker creates  -> Pending Approval
Checker decides (not the maker)
   Approved  -> counts in the balance above
   Rejected  -> needs a reason; no effect
```

Each step is written to Activity Log with the user, time, record and outcome.

### 6.5 Settlements and credit notes

For each completed fuelling:

```
under-canopy discount = litres x under_canopy_discount_per_litre
Jaguar discount       = litres x jaguar_discount_per_litre
net to dealer         = gross - under-canopy discount        (Jaguar discount is NOT deducted)
credit note (UNDER_CANOPY)  = under-canopy discount
credit note (CONTRACTUAL)   = Jaguar discount
```

Rates are in Galana Settings and start at 0. Galana Finance (FINANCE_MAKER and FINANCE_CHECKER) sets them; System Administrators can change every setting. Settlements and credit notes are pending. Nothing is posted to any ledger.

### 6.6 Scope and access in the portal

- Only Galana customers appear anywhere (`galana_customers`, from Galana Settings).
- Dashboard sections depend on role: operations (ops, admin, auditor), finance (finance roles, admin, auditor), Jaguar (Jaguar and the finance and ops roles), dealer (dealer manager).
- A dealer manager sees only the station on their user record (`galana_station`) and no customer accounts.
- Fuelling is attributed to a station through the POS device's current allocation. This assumes `pts_id` is the POS serial number.

---

## 7. Frontend (Galana portal) to backend map

| Page | Backend call |
|---|---|
| Dashboard | `portal_dashboard` |
| Transactions and detail | `transactions`, `transaction` |
| Failed transactions | `transactions` with `status=FAILED` |
| Fuel tickets and detail | `tickets`, `ticket_status` |
| Reconciliation | `ticket_reconciliation` (Jaguar feed) |
| Customers and detail | `portal_customers`, `portal_customer` |
| Funding wallet | `topups`, `create_topup`, `decide_topup` |
| Adjustments | `adjustments`, `create_adjustment`, `decide_adjustment` |
| Reversals | `reversals`, `create_reversal`, `decide_reversal` |
| Settlements | `settlements` |
| Credit notes | `credit_notes` |
| Stations | `stations`, `save_station`, `set_station_status`, `fuel_products`, `dealers` |
| Dealers | `dealers`, `update_dealer` |
| POS devices | `pos_devices`, `create_pos_device`, `set_pos_device_status`, `approved_versions` |
| EPRA prices | `epra_price_history`, `add_epra_price` |
| Reports | `portal_report` |
| Users | `portal_users`, `create_portal_user`, `update_portal_user`, `set_portal_user_status`, `reset_portal_user_password` |
| Settings | `portal_settings`, `save_portal_settings` |
| Audit log and export | `audit_log` |
| Validate ticket (Jaguar check) | `validate_ticket` |

Sign-in uses `portal_login` (password check and roles) and `portal_profile` (status on each session check).

---

## 8. Test data on `crm`

Created for testing, all named TEST:

- Stations `TEST-ST-01`, `TEST-ST-02` under `TEST Dealer`.
- POS devices `TEST-POS-0001` to `0003`.
- Vehicles `KTEST 001` to `003`.
- 30 completed fuellings and 3 failed attempts, all with `notes` = "TEST DATA".
- Tickets `TEST-TKT-*`.
- Top-ups and adjustments named `TEST ...`.

The wallet is currently overdrawn by this data, so `authorise` will refuse until it is removed or more is approved.

---

## 9. Known gaps

- Jaguar inbound (tickets and customers pushed to Galana) and outbound (Galana calling Jaguar): not built, need Jaguar's contract.
- Idempotency-Key header on `transaction_events`: duplicates are blocked by POS ID and transaction number, not by the header.
- Reconciliation records and the exception queue: not built, waiting on a decision.
- The Jaguar portal's own balance still reads the old ledger, so it can differ from the partner balance above.
- Driver OTP SMS: `authorise` returns the code, but nothing sends it.
- Stuck "Dispensing" tickets never expire.
- `v1.ingest_fuel_transaction` cannot load until the JPL default POS customer is set. Its public access is closed.
- The `actor` field on portal writes is trusted from the Galana service account. Anyone holding that account can name any user as the actor.
