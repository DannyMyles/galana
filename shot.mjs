import { chromium } from "playwright"
const [,, email, land, ...paths] = process.argv
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1440,height:900}})
await p.goto("http://localhost:3000/login"); await p.fill('input[type="email"]', email); await p.fill('input[type="password"]', "Password123!"); await p.click('button[type="submit"]'); await p.waitForURL("**"+land, {timeout:60000})
for (const path of paths) { await p.goto("http://localhost:3000"+path, {waitUntil:"networkidle"}); await p.waitForTimeout(600); await p.screenshot({path:`/tmp/s-${path.replace(/[\/?=&]/g,"_")}.png`}); console.log("shot", path) }
await b.close()
