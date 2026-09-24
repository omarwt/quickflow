#!/usr/bin/env python3
"""Coverage check for a requirements analysis (generic).
usage: phase-01.py <prd.md> <analysis.md>"""
import re, sys

prd, ana = open(sys.argv[1], encoding="utf-8-sig").read(), open(sys.argv[2]).read()
gaps = []
for i in sorted(set(re.findall(r"\b[A-Z]{2,4}-\d{1,3}\b", prd))):
    if i not in ana:
        gaps.append(f"PRD id {i} missing")
stories = re.findall(r"^\s*-\s*As an? [^,]+, I want", prd, re.M)
us_ids = set(re.findall(r"\bUS-[A-Z]+-\d+\b", ana))
if len(us_ids) < len(stories):
    gaps.append(f"{len(stories)} user stories in PRD, only {len(us_ids)} US- ids")
rules = re.search(r"^## \d+\. Business Rules$(.*?)^## ", prd, re.M | re.S)
n = len(re.findall(r"^\d+\.\s", rules.group(1), re.M)) if rules else 0
gaps += [f"BR-{k} missing" for k in range(1, n + 1) if not re.search(rf"\|\s*BR-{k}\s*\|", ana)]
nfr = re.search(r"^## \d+\. Non-Functional Requirements$(.*?)^## ", prd, re.M | re.S)
for area in re.findall(r"^### (.+)$", nfr.group(1), re.M) if nfr else []:
    if f"| {area.strip()} |" not in ana:
        gaps.append(f"NFR area {area.strip()} missing")
if "## Ambiguities" not in ana:
    gaps.append("no Ambiguities section")
print(f"stories={len(stories)} us_ids={len(us_ids)} business_rules={n}")
for g in gaps:
    print("GAP", g)
print("coverage:", "PASS" if not gaps else f"FAIL ({len(gaps)} gaps)")
sys.exit(1 if gaps else 0)
