# Claude Loops, in plain words

This project was not written by hand. It was built by a Claude Code agent following a set of
written instructions called **loops**. This page explains what a loop is, how the three loops in
this repo fit together, and how the app got built with them.

## The idea

A loop is a repeatable way of working that lives in files, not in anyone's head. It says:

1. Read the requirements.
2. Split the work into small phases, in the order they depend on each other.
3. For each phase: build it, prove it works, write down what happened, move on.
4. If a phase can't be proven after three tries, mark it blocked and carry on with something else.

"Prove it works" is the important part. A phase is never done because the code compiles. It is
done when the running app was actually exercised and the result was recorded.

## The three loops

| Loop | Job | How it proves a phase works |
| --- | --- | --- |
| **backend-dev** | Builds the API, one domain at a time (tasks, habits, plans, ...) | Calls every endpoint with `curl` against the running server and checks the answers |
| **frontend-dev** | Builds the pages, one at a time, against the API | Drives the page in a real browser through the Playwright MCP server, step by step, and checks what is on screen |
| **orchestrator** | Reads the PRD, decides the phases for both workers, runs them in order, then does a final check and writes the docs | Looks at the workers' checklists and runs the whole user journey at the end |

The orchestrator is the manager. The other two are the workers. A frontend page cannot start
until the backend phase it needs is finished.

## What is in a loop folder

Every loop has the same five things:

- **Loop-instructions.md** – the procedure the agent follows. Written for a person to read.
- **task.md** – the plan: each phase, what it depends on, and a checklist of its tasks. The agent
  ticks boxes here as it works. This is also where a restart picks up from.
- **progress.md** – the diary: when each phase started and ended, how many tries it took, what
  went wrong and how it was fixed.
- **verification/** – the proof scripts: a curl script per backend phase, a numbered browser
  scenario per frontend phase.
- **outputs/** – one write-up per phase, plus an `evidence/` folder with the logs and screenshots
  of every verification run.

## How one phase runs

```text
pick the next phase whose dependencies are done
        │
        ▼
mark it "in progress" in task.md, open its write-up
        │
        ▼
build the thing, ticking tasks as they finish
        │
        ▼
write the check (curl script or browser scenario)
        │
        ▼
run the checks ──── pass ───► finish the write-up, mark the phase done
        │
       fail
        │
        ▼
note the error, fix it, run the checks again (at most three tries)
        │
   third failure
        │
        ▼
mark the phase blocked, and everything that depends on it, then move on
```

## How the app was built

1. The orchestrator read `PRD.md` and gave every requirement an ID. Anything ambiguous got a
   written decision rather than a guess.
2. From those requirements it drew a dependency graph and wrote the two workers' plans: seven
   backend phases (foundation, tasks, habits, learning resources, plans, dashboard, regression)
   and eleven frontend phases (app shell, one page per feature, then UI/UX work, then the final
   journey).
3. backend-dev ran all seven phases. Each one ended with its curl script passing against a fresh
   database and the OpenAPI document listing the new endpoints.
4. frontend-dev started once the backend was done. Each page was verified by a headless browser
   session that followed the scenario and reported pass or fail per step, with screenshots.
   The UI/UX phases added a Lighthouse gate (accessibility, best practices, SEO, layout shift)
   and re-ran the earlier scenarios so nothing regressed.
5. The orchestrator's last phase runs everything once more on a fresh database and writes the
   final docs. At the time of writing, the frontend is on its second-to-last phase and this
   final step has not run yet.

## What changed along the way

The first version of the loops kept all the state in a small Python script. Every step of the
process was a command to that script, and the checklists were generated from a JSON file. It was
exact but hard to read, and it tied the loops to having Python around.

The loops were then simplified so that the instructions read as plain steps and the state is
the two Markdown files, `task.md` and `progress.md`, kept by hand. The proof scripts and the
three-tries rule stayed the same. The old script and its JSON state are still in the repo but
nothing uses them anymore.

## How to run a loop

```bash
loops/run.sh orchestrator --input PRD.md      # build everything from the PRD
loops/run.sh backend-dev --input PRD.md       # only the backend
loops/run.sh orchestrator --resume            # carry on after an interruption
```

Or open Claude Code in the repo and say "Run the backend-dev loop on PRD.md". For a single
user story, pass the story text instead of the PRD with `--mode story`.
