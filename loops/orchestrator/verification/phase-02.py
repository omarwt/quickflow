#!/usr/bin/env python3
"""Plan check (generic): every requirement ID in the analysis is owned by a worker phase, all
dependencies exist, cross-loop references point at real phases, and there are no cycles.
usage: phase-02.py <analysis.md> <loop>...   (reads loops/<loop>/state/loop-state.json)"""
import json, os, re, sys

loops_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
ana = open(sys.argv[1]).read()
ids = set(re.findall(r"^\|\s*((?:US-[A-Z]+|FR|BR|NFR|TR|DoD|UX)-[A-Z0-9]+|I-\d+)\s*\|", ana, re.M))
phases = {l: json.load(open(os.path.join(loops_dir, l, "state", "loop-state.json")))["phases"] for l in sys.argv[2:]}
gaps, owned = [], set()
for loop, ph in phases.items():
    known = {p["id"] for p in ph}
    for p in ph:
        owned |= set(p.get("requirements", []))
        for d in p.get("dependsOn", []):
            if d.startswith("ext:"):
                other, _, pid = d[4:].partition("/")
                if pid not in {x["id"] for x in phases.get(other, [])}:
                    gaps.append(f"{p['id']}: unknown cross-loop dependency {d}")
            elif d not in known:
                gaps.append(f"{p['id']}: unknown dependency {d}")
    graph = {p["id"]: [d for d in p.get("dependsOn", []) if not d.startswith("ext:")] for p in ph}
    seen, stack = set(), set()
    def visit(n):
        if n in stack:
            gaps.append(f"{loop}: dependency cycle at {n}")
            return
        if n in seen or n not in graph:
            return
        stack.add(n); [visit(d) for d in graph[n]]; stack.discard(n); seen.add(n)
    [visit(n) for n in graph]
gaps += [f"{i} not planned in any phase" for i in sorted(ids - owned)]
gaps += [f"{i} planned but not in the analysis" for i in sorted(owned - ids)]
print(f"analysis ids={len(ids)} planned ids={len(owned)} phases={sum(len(p) for p in phases.values())}")
for g in gaps:
    print("GAP", g)
print("plan check:", "PASS" if not gaps else f"FAIL ({len(gaps)} gaps)")
sys.exit(1 if gaps else 0)
