---
name: discover
description: Build or update the product vision, the story map and the roadmap, then propose the issues of the next release (human product gate). Use when the user runs /discover, at project start and at the end of each release.
argument-hint: [vision|map|release]
disable-model-invocation: true
---

# /discover [vision|map|release]

Product decisions belong to the human. Your job is to interview, structure and
challenge, then write down what was decided. Run the steps in order; with an
argument, run only that step.

Work on a branch `docs/<NNN>-product-discovery` (issue number padded to three digits) linked to a chore issue, and open a
PR at the end. Nothing is created in GitHub before the human has merged that PR.

## vision: `docs/product/vision.md`

Interview the human, a few questions at a time, then write one page:
who uses the product and in which situation, the problem it solves, what success
looks like, the principles that guide trade-offs, and what the product will not do.
Use `CONTEXT.md` vocabulary. Challenge vague answers with concrete cases.

## map: `docs/product/story-map.md`

- Backbone: the user activities in the order they happen (for example: manage access,
  maintain references, prepare a discharge, execute, validate, close, report).
- Under each activity, the user actions, most essential first. One line per action,
  phrased as what the user does, with the actor.
- Delegate to the `product-owner` agent, in discovery mode, to check for missing
  actions, actions that are really two, and actions that are solutions rather than needs.

## release: `docs/product/roadmap.md`

- Draw the next release as a horizontal slice of the map: the minimum in each activity
  that lets a user go through the whole flow end to end.
- The roadmap has three levels only: Now (the release being built, fully listed),
  Next (titles), Later (titles). No dates.
- For the Now release, list the issues to create: one epic per activity touched, one
  feature per action, in delivery order, each with a one-line outcome.
- Later slices stay as titles. Do not specify what will not be built soon.

## After the human has merged the discovery PR

Only then, and only on request, create in GitHub: the milestone for the release, the
epics, then the features following `.github/ISSUE_TEMPLATE/feature.yml`, each linked
to its epic and milestone. List what you created.

Title each issue as `docs/conventions.md` says: `<Area>: <what the user does>` for a
feature, the name of the activity for an epic, no type prefix. Give each issue its label
(`feat`, `epic`): a command-line creation does not apply the label of the form. If a
label does not exist in the repository, stop and tell the human.
