# ShieldScan — Buyer FAQ

**Anticipated questions and recommended answers**

---

## Strategic Questions

### "Why are you selling?"

**Answer:**
> "We built this to solve our own security needs and it exceeded expectations. We're now at a decision point: raise capital and spend 18+ months scaling, or transfer ownership to a strategic partner who can integrate it faster. Given the market timing and our bandwidth, the partnership route makes more sense."

**What NOT to say:**
- "We couldn't get traction"
- "We need the money"
- "We're burned out"

---

### "Why can't we just build this ourselves?"

**Answer:**
> "You absolutely can. Our estimate is 12-18 months and €260K-€400K in engineering time. The question is whether that's the best use of your team's time, or whether acquiring proven infrastructure lets you focus on your core differentiation."

**Add if they push:**
> "We spent [X months] learning what doesn't work — the false positive tuning alone took 3 months. Buying skips that learning curve."

---

### "What's the moat?"

**Answer:**
> "Three things: (1) The evidence chain system that makes every finding legally defensible, (2) The false positive engine that's been tuned through [X] scans, and (3) The compliance mapping that took months to build correctly. These aren't features you can copy from a spec — they require iteration."

---

### "What if you disappear after the sale?"

**Answer:**
> "The codebase is fully documented with deployment guides, architecture docs, and inline comments. We're offering [60-90 days] of transition support included, with extended support available if needed. The goal is a clean handover."

---

## Technical Questions

### "What's the tech stack?"

**Answer:**
> "Next.js 14 frontend, Firebase for auth and database, Stripe for payments. Standard modern stack — your team will be productive immediately. No exotic dependencies."

---

### "What about test coverage?"

**Honest answer:**
> "We prioritized shipping features over test coverage. Current coverage is minimal. For a team integrating this, I'd recommend allocating 2-3 weeks for adding tests to critical paths before any major modifications."

**Why this works:** Honesty builds trust. Every buyer knows early-stage products have gaps.

---

### "How does scanning work?"

**Answer:**
> "The scanner makes HTTP requests to analyze security headers, SSL configuration, DNS records, and common vulnerability patterns. It's non-destructive — no credential stuffing, no DoS techniques. Everything is rate-limited and logged for compliance."

---

### "Can this scale?"

**Answer:**
> "Current architecture handles [X] concurrent scans. For higher scale, the scan engine can be extracted into serverless functions or a queue-based worker system. The code is structured to support that migration."

---

## Financial Questions

### "How did you arrive at the asking price?"

**Answer:**
> "Three inputs: (1) Rebuild cost analysis suggests €260K-€400K in engineering time, (2) Similar security tool acquisitions in 2023-2024 traded at [X] range, (3) Time-to-market value — 12-18 months of product development you'd skip."

**If they challenge:**
> "I'm open to discussing structure. What range were you thinking?"

---

### "Any revenue?"

**If yes:**
> "We have [€X] MRR from [X] customers. Happy to share details in the data room."

**If no:**
> "This is a pre-revenue asset sale. We focused on building the product rather than sales and marketing. The value is in the IP and time-to-market."

---

### "What's included in the sale?"

**Answer:**
> "All source code, IP, trademarks, domain, documentation, and [X days] of transition support. Customer relationships if any. Standard asset purchase structure."

---

### "Are you talking to other buyers?"

**Answer (if true):**
> "We're in conversations with a few parties at various stages. I'm focused on finding the right strategic fit, not maximizing the number of offers."

**Answer (if not true, but you want leverage):**
> "We're being selective about who we share details with. Our priority is finding a partner who will actually use and grow this, not just acquire and shelf it."

---

## Due Diligence Questions

### "Can we do a code review?"

**Answer:**
> "Absolutely. I can provide read access to the repository under NDA, or walk your team through the architecture on a call first."

---

### "Any known security issues?"

**Answer:**
> "No known vulnerabilities in the production code. We do have a list of technical improvements we'd planned for future releases — happy to share that for transparency."

---

### "What's the team situation?"

**If solo:**
> "I built this solo, which means clean IP ownership and no complicated cap table. I'm available for [X months] of transition support."

**If team:**
> "Our team is [X people]. For this transaction, we're discussing [asset sale / acqui-hire options]. Happy to detail that based on your structure preference."

---

## Objection Handling

### "The price is too high."

**Response:**
> "Help me understand your thinking. Are you comparing to build cost, or to other acquisitions you've seen?"

**Then:**
> "I'm flexible on structure. Would an earn-out component work better for your risk profile?"

---

### "We need to think about it."

**Response:**
> "Of course. What specific questions does your team need answered? I'd rather address concerns directly than leave things ambiguous."

**Follow up with:**
> "What timeline are you working with for a decision?"

---

### "We're not actively acquiring right now."

**Response:**
> "Understood. Should I check back in [3-6 months], or is there someone else at [Company] I should speak with about strategic opportunities?"

---

### "Can you lower the price significantly?"

**Response:**
> "What range would make this work for you?"

*Listen first. Then:*

> "I can be flexible on structure — perhaps a lower upfront with an earn-out tied to [integration milestones / revenue targets]. Does that direction interest you?"

---

## Red Flags from Buyers (Watch For)

| Buyer Behavior | What It Means | Your Response |
|----------------|---------------|---------------|
| Asks for full code access pre-NDA | May be fishing for ideas | "Happy to share after NDA" |
| Immediately negotiates price | Testing your floor | Hold firm initially |
| Wants exclusivity early | Trying to lock you out | "After LOI, yes" |
| Vague about budget | May not be serious | "What range are you working with?" |
| Very long diligence timeline | Stalling or tire-kicking | "We're targeting close in X weeks" |

---

## Questions to ASK Buyers

1. "What would you do with ShieldScan on Day 1?"
2. "How does this fit your product roadmap?"
3. "What's your typical acquisition timeline?"
4. "Who else needs to approve this?"
5. "What's made past acquisitions successful for you?"

---

## Closing Phrases

**Creating urgency (use sparingly):**
> "We're planning to make a decision by [date] to focus our next phase."

**Showing flexibility:**
> "I'm more interested in the right fit than the highest number."

**Moving forward:**
> "What would you need to see to move to the next step?"

---

*Remember: The goal is to reduce buyer risk and make the purchase feel inevitable.*

