# news-image-20261121 — The World in One Day

[![make.fun](https://make.fun/badge/news-image-20261121.svg)](https://make.fun/bounty/news-image-20261121)
[![rank](https://make.fun/badge/news-image-20261121/HALCYON1803/news-image-20261121/rank.svg)](https://make.fun/bounty/news-image-20261121)
[![reward](https://make.fun/badge/news-image-20261121/HALCYON1803/news-image-20261121/reward.svg)](https://make.fun/bounty/news-image-20261121)

A one-day world news front page for **Saturday 21 November 2026**, built on the
layout the leaderboard's top entries share: the date itself is the masthead,
a six-number strip and a region-count bar sit under it, and the page carries
3 heroes + 13 mids, every one with its own picture and a named source — the
Wall Street rout (S&P −3.7%, Nasdaq −5.28%, Nvidia −14% as the SEC probes
its accounts), the 6.8 quake in Peru, KL Rahul's 100 in Wellington, Bitcoin
sinking below $60,000, COP31 slipping into overtime with no deal, Norris on
pole in a wet Las Vegas qualifying, Trump's "very good talks" with Putin, the
missile strike on Kryvyi Rih, the plan to close Rikers Island by 2032,
record foreign cash pouring into Indian shares, four nations demanding Gaza
aid access, Saudi intercepts over Riyadh, Nepal's prime minister heading to
Delhi, gold at a 14-month low, the Palisades arson verdict, and a vendor
cyberattack on the big banks. A new "THE DAY, FROM ASIA TO AMERICA" strip
follows the day's arc in four beats — Asia waking to the Wall St rout,
Europe's COP31 overtime, America's Friday-evening news reported Saturday,
the overnight quake and the Vegas pole. A world map pins all 16 drawn
stories, 24 numbered briefs cover the rest of the day — the STI below
5,000, France's fourth weekend of protests, a pancreatic cancer pill
breakthrough, and more — and a DATE CHECK box names the Friday and Thursday
stories left out (the Kyiv bridges, the Poland missiles, the ICJ Myanmar
ruling, the EU's €7.9bn payment to Kyiv, the Denmark plot reveal, the UK–EU
deals, the Anthropic debut). 40 stories in all, every one verified as having
happened, or first been reported, on 21 November 2026.

The image is drawn entirely in code: a hand-written canvas, a 5x7 bitmap
font, and 16 hand-drawn illustrations — a falling candlestick chart, a
shaking city, a batsman, a sinking coin, an empty COP31 hall, a wet-weather
race car, two flags at a table, a shelled building, a barred island, rising
bars, an aid truck in flood water, a missile intercept, the Himalayas, a
stack of gold bars, a courthouse, and a bank under a binary rain — plus a
halftone dot screen in every picture sky and a deterministic newsprint
grain over the light paper, which is why the file is far richer than v1's
41 KB. The program runs with no network and writes the same bytes on
every run.

Run it with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`, then check
`out/entry.png`: 1024×1024, 143,508 bytes, sha256
`255a0c46070dd3bfdfba3d89db33156444e1f827e76cf686fee7e45b7c193460`,
identical across repeated runs.

## v2 vs v1 (judge 0.968674, #1807/4507)

- Same 40 verified stories, but three briefs are promoted to illustrated
  mids (gold, Palisades verdict, bank cyberattack), so 16 stories carry
  their own picture instead of 13, and the map pins all 16.
- New full-day strip ("THE DAY, FROM ASIA TO AMERICA") built only from
  already-verified facts. No afternoon score or result is invented: the
  public web search was down while v2 was built, so no new afternoon story
  could be checked and none was added — the honest full-day lever available
  was the day's arc, the extra pictures, and the richer art.
- Richer art: halftone skies, clipped hatching, newsprint grain (fixed-seed
  LCG, high bits — the low bits of a glibc LCG cycle too fast to spread, so
  an early version flecked only 252 distinct pixels), category glyphs
  beside each brief. PNG 41,093 → 143,508 bytes, still one 1024×1024 file
  under the 1 MiB cap.
