import { chromium } from "playwright"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } })
const errors = []
page.on("pageerror", (err) => errors.push("pageerror: " + err.message))
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text().slice(0, 200))
})

await page.goto("http://localhost:3000/login")
await page.fill('input[type="email"]', "admin@galana.co.ke")
await page.fill('input[type="password"]', "Password123!")
await page.click('button[type="submit"]')
await page.waitForURL("**/dashboard", { timeout: 10000 })
await page.waitForTimeout(500)
await page.screenshot({ path: "/tmp/v2-sidebar-open.png" })

await page.click('button[aria-label="Toggle navigation"]')
await page.waitForTimeout(400)
await page.screenshot({ path: "/tmp/v2-dashboard.png" })

await page.goto("http://localhost:3000/stations")
await page.waitForTimeout(500)
await page.screenshot({ path: "/tmp/v2-stations.png" })

await page.goto("http://localhost:3000/login")
await page.waitForTimeout(300)
await page.screenshot({ path: "/tmp/v2-login.png" })

await browser.close()
console.log("ERRORS:", JSON.stringify(errors, null, 2))
