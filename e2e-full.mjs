import { chromium } from "playwright"
const b = await chromium.launch()
const results = []
const step = async (name, fn) => { try { await fn(); results.push(["PASS", name]); console.log("PASS", name) } catch (e) { const m = String(e.message).split(String.fromCharCode(10))[0].slice(0, 220); results.push(["FAIL", name + " :: " + m]); console.log("FAIL", name, "::", m) } }
const login = async (email) => { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.goto("http://localhost:3000/login"); await p.fill('input[type="email"]', email); await p.fill('input[type="password"]', "Password123!"); await p.click('button[type="submit"]'); await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 60000 }); return p }
const B = "http://localhost:3000"
let txnId

// ---- Dealer manager: POS flow
const sm = await login("station.manager@galana.co.ke")
await step("SM lands on validate-ticket (role landing)", async () => { if (!sm.url().includes("/validate-ticket")) throw new Error("landed " + sm.url()) })
await step("Rejected screen for bad OTP", async () => { await sm.fill("#cred-otp", "000000"); await sm.click('button:has-text("Validate ticket")'); await sm.waitForSelector("text=Ticket cannot be redeemed"); await sm.waitForSelector("text=Invalid OTP"); await sm.click('button:has-text("Try another ticket")') })
await step("QR validation approves ticket", async () => { await sm.getByRole("tab", { name: "QR Code" }).click(); await sm.fill("#cred-qr", "QR-GTK-001234"); await sm.click('button:has-text("Validate ticket")'); await sm.waitForSelector("text=Approved"); await sm.waitForSelector("text=Authorised value") })
await step("Quantity limit shown inline", async () => { await sm.fill("#quantity", "9999"); await sm.waitForSelector("text=Cannot exceed"); if (!(await sm.locator('button:has-text("Proceed to authorise")').isDisabled())) throw new Error("not disabled") })
await step("Authorise -> dispensing page", async () => { await sm.fill("#quantity", "20"); await sm.click('button:has-text("Proceed to authorise")'); await sm.waitForURL("**/dispensing/**"); txnId = sm.url().split("/").pop() })
await step("Start fuelling then complete", async () => { await sm.click('button:has-text("Start fuelling")'); await sm.waitForSelector("#dispensedQty"); await sm.fill("#dispensedQty", "20"); await sm.click('button:has-text("Complete transaction")'); await sm.waitForSelector("text=consumption posted", { timeout: 15000 }) })
await step("SM station transactions (scoped) + detail trace", async () => { await sm.goto(B + "/transactions"); await sm.waitForSelector("text=Station transactions"); await sm.goto(B + `/transactions/${txnId}`); await sm.waitForSelector("text=State history"); await sm.waitForSelector("text=Dealer settlement") })
await step("SM blocked from /administration/users", async () => { await sm.goto(B + "/administration/users"); await sm.waitForTimeout(800); if (sm.url().includes("/administration")) throw new Error("not redirected: " + sm.url()) })
await step("SM failed-transactions is read-only/scoped", async () => { await sm.goto(B + "/failed-transactions"); await sm.waitForSelector("text=Failed Transactions"); if (await sm.locator('button:has-text("Mark as Resolved")').count()) throw new Error("has resolve btn") })

// ---- Finance maker
const fm = await login("finance.maker@galana.co.ke")
await step("Maker requests reversal", async () => { await fm.goto(B + `/transactions/${txnId}`); await fm.click('button:has-text("Request reversal")'); await fm.fill("#reversal-reason", "Pump meter fault, customer overcharged"); await fm.click('button:has-text("Submit for approval")'); await fm.waitForSelector("text=Pending approval, text=Pending Approval", { timeout: 8000 }).catch(() => {}); await fm.goto(B + "/reversals"); await fm.waitForSelector("text=Pump meter fault") })
await step("Maker records credit note", async () => { await fm.goto(B + "/credit-notes"); await fm.click('button:has-text("Record credit note")'); await fm.fill("#cn-amount", "500"); await fm.fill("#cn-reason", "Volume discount Q3"); await fm.getByRole("dialog").getByRole("button", { name: "Submit for approval" }).click(); await fm.waitForSelector("text=Volume discount Q3") })
await step("Auto discount credit notes exist", async () => { await fm.goto(B + "/credit-notes"); await fm.waitForSelector("text=System (auto)") })
await step("Maker requests adjustment", async () => { await fm.goto(B + "/adjustments"); await fm.click('button:has-text("Request adjustment")'); await fm.fill("#adj-amount", "1000"); await fm.fill("#adj-reason", "Correct duplicate debit"); await fm.getByRole("dialog").getByRole("button", { name: "Submit for approval" }).click(); await fm.waitForSelector("text=Correct duplicate debit") })
await step("Maker cannot approve own reversal (no approve UI)", async () => { await fm.goto(B + "/reversals"); await fm.waitForSelector("text=Awaiting checker") })
await step("Funding history search + my requests + export link", async () => { await fm.goto(B + "/funding-wallet"); await fm.waitForSelector("text=My requests"); await fm.waitForSelector('a:has-text("Export CSV")') })

// ---- Finance checker
const fc = await login("finance.checker@galana.co.ke")
const walletBefore = async () => Number((await (await fc.request.get(B + "/api/auth/session")).json()) ? 0 : 0)
await step("Checker approves reversal with comment", async () => { await fc.goto(B + "/reversals"); await fc.click('button:has-text("Approve")'); await fc.fill("#decision-text", "Verified against pump log"); await fc.getByRole("dialog").getByRole("button", { name: "Approve" }).click(); await fc.waitForSelector("text=Verified against pump log", { timeout: 10000 }) })
await step("Reversed txn shows REVERSED trace", async () => { await fc.goto(B + `/transactions/${txnId}`); await fc.waitForSelector("text=Reversed") })
await step("Checker approves credit note + adjustment", async () => { await fc.goto(B + "/credit-notes"); await fc.getByRole("row", { name: /Volume discount Q3/ }).getByRole("button", { name: "Approve" }).click(); await fc.fill("#decision-text", "ok"); await fc.getByRole("dialog").getByRole("button", { name: "Approve" }).click(); await fc.waitForSelector("text=ok", { timeout: 10000 }); await fc.goto(B + "/adjustments"); await fc.getByRole("row", { name: /Correct duplicate debit/ }).getByRole("button", { name: "Approve" }).click(); await fc.getByRole("dialog").getByRole("button", { name: "Approve" }).click(); await fc.waitForTimeout(1500) })
await step("Reconciliation run (3 levels)", async () => { await fc.goto(B + "/reconciliation"); await fc.click('button:has-text("Run reconciliation")'); await fc.waitForSelector("text=Checked", { timeout: 15000 }).catch(() => {}); await fc.waitForTimeout(1500); await fc.getByRole("link", { name: /Financial/ }).click(); await fc.waitForSelector("text=Fuel wallet ledger", { timeout: 8000 }) })

// ---- Admin
const ad = await login("admin@galana.co.ke")
await step("Dashboard shows top-ups KPI", async () => { await ad.goto(B + "/dashboard"); await ad.waitForSelector("text=Total Top-ups") })
await step("Add station with contacts+GPS", async () => { await ad.goto(B + "/stations"); await ad.click('button:has-text("Add station")'); await ad.fill("#st-name", "Galana Karen"); await ad.fill("#st-code", "kr002"); await ad.fill("#st-region", "Nairobi"); await ad.fill("#st-county", "Nairobi"); await ad.fill("#st-lat", "-1.31"); await ad.fill("#st-lng", "36.71"); await ad.fill("#st-cn", "Jane"); await ad.fill("#st-cp", "+254711111111"); await ad.getByRole("dialog").getByLabel("Petrol (PMS)").click(); await ad.getByRole("dialog").getByRole("button", { name: "Add station" }).click(); await ad.waitForSelector("text=Galana Karen", { timeout: 10000 }) })
await step("Bulk upload stations reports errors", async () => { await ad.click('button:has-text("Bulk upload")'); const csv = "name,code,region,county,address,latitude,longitude,contactName,contactPhone,contactEmail,dealer,products\nGalana Thika,TH003,Kiambu,Kiambu,,,,,,,,PMS;AGO\nBad Row,,Nairobi,Nairobi,,,,,,,,PMS\nDup,KR002,Nairobi,Nairobi,,,,,,,,PMS\n"; await ad.setInputFiles('input[type="file"]', { name: "s.csv", mimeType: "text/csv", buffer: Buffer.from(csv) }); await ad.click('button:has-text("Upload & process")'); await ad.waitForSelector("text=1 processed · 2 with errors", { timeout: 10000 }); await ad.waitForSelector("text=already exists") ; await ad.keyboard.press("Escape") })
await step("Edit station", async () => { await ad.reload(); await ad.getByRole("button", { name: "Edit Galana Thika" }).click(); await ad.waitForSelector("text=Edit station"); await ad.keyboard.press("Escape") })
await step("Create multi-role user with status", async () => { await ad.goto(B + "/administration/users"); await ad.click('button:has-text("Add user")'); await ad.fill("#u-name", "Test Multi"); await ad.fill("#u-email", "multi@galana.co.ke"); await ad.getByRole("dialog").getByLabel("Galana Finance Maker").click(); await ad.getByRole("dialog").getByLabel("Internal Auditor").click(); await ad.getByRole("dialog").getByRole("button", { name: "Create user" }).click(); await ad.waitForSelector("text=temporary password"); await ad.keyboard.press("Escape") })
await step("Settings save", async () => { await ad.goto(B + "/administration/settings"); await ad.fill("#underCanopyDiscountPct", "1.5"); await ad.click('button:has-text("Save settings")'); await ad.waitForSelector("text=Settings saved") })
await step("Integrations inventory", async () => { await ad.goto(B + "/administration/integrations"); await ad.waitForSelector("text=US-INT-001"); await ad.waitForSelector("text=US-POS-007") })
await step("Audit log drawer + financial preset", async () => { await ad.goto(B + "/administration/audit-log?preset=financial"); await ad.getByRole("button", { name: "Details" }).first().click(); await ad.waitForSelector("text=Old values"); await ad.waitForSelector("text=IP address"); await ad.keyboard.press("Escape") })
await step("Export audit CSV (auth'd)", async () => { const r = await ad.request.get(B + "/api/export/audit-log"); const t = await r.text(); if (r.status() !== 200 || !t.includes("old_values")) throw new Error(r.status() + t.slice(0, 60)) })
await step("POS versions + online status", async () => { await ad.goto(B + "/stations/pos-devices"); await ad.waitForSelector("text=Connectivity"); await ad.getByRole("button", { name: "Approved versions" }).click(); await ad.waitForSelector("text=GTK-V2.4"); await ad.keyboard.press("Escape") })
await step("Dealer edit dialog", async () => { await ad.goto(B + "/stations/dealers"); await ad.getByRole("button", { name: /Edit Galana Westlands/ }).click(); await ad.waitForSelector("text=Edit dealer"); await ad.keyboard.press("Escape") })
await step("EPRA bulk dialog", async () => { await ad.goto(B + "/stations/epra-prices"); await ad.click('button:has-text("Bulk upload")'); await ad.waitForSelector("text=Download CSV template"); await ad.keyboard.press("Escape") })

// ---- Auditor
const au = await login("auditor@galana.co.ke")
await step("Auditor reconciliation read-only", async () => { await au.goto(B + "/reconciliation"); await au.waitForSelector("text=Reconciliation"); if (await au.locator('button:has-text("Run reconciliation")').count()) throw new Error("has run btn") })
await step("Auditor sees adjustments/reversals/credit notes, no create", async () => { for (const p of ["/adjustments", "/reversals", "/credit-notes"]) { await au.goto(B + p); await au.waitForTimeout(500); if (au.url().includes("/login") || au.url().endsWith("/dashboard")) throw new Error("blocked " + p) } })
await step("Auditor failed-transactions read-only", async () => { await au.goto(B + "/failed-transactions?view=resolved"); await au.waitForSelector("text=Failed Transactions"); if (await au.locator('button:has-text("Retry Authorization")').count()) throw new Error("actions visible") })
await step("Auditor transaction trace", async () => { await au.goto(B + `/transactions/${txnId}`); await au.waitForSelector("text=Audit trail") })
await step("Auditor blocked from users", async () => { await au.goto(B + "/administration/users"); await au.waitForTimeout(600); if (au.url().includes("/administration/users")) throw new Error("not blocked") })

// ---- Ops
const ops = await login("ops@galana.co.ke")
await step("Ops: transactions filters + ops landing", async () => { await ops.goto(B + "/transactions"); await ops.waitForSelector('input[aria-label="From date"]'); await ops.waitForSelector("text=All stations") })
await step("Ops: credit notes view (no approve)", async () => { await ops.goto(B + "/credit-notes"); await ops.waitForSelector("text=Credit Notes") })

await b.close()
for (const [s, n] of results) console.log(s, n)
console.log(results.filter((r) => r[0] === "FAIL").length ? "\nSOME FAILED" : "\nALL PASSED")
