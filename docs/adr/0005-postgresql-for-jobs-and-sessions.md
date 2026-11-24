# 0005. PostgreSQL for jobs and sessions; no Redis, no Kafka

Status: accepted (2026-11-24)

## Context

Background work is needed (report generation, e-mails) and real-time updates must
reach connected screens. Volumes are those of one port site: hundreds of rotations a
day. Every extra service must be deployed, monitored, backed up and started in tests.

## Decision

- PostgreSQL is the only data service: business data, sessions and the job queue.
- A job is enqueued in the same transaction as the business change that requires it.
- Real-time fan-out uses an in-process broadcaster.
- The domain declares two ports, a job queue and an event publisher, so another
  implementation can be plugged in later.
- Kafka is out of scope. Redis is deferred until a measured need.

## Consequences

- Two components to run besides file storage: the API and PostgreSQL.
- A committed business change guarantees its job is scheduled.
- Running several API instances will require a shared event channel (PostgreSQL
  notifications or Redis) and a new ADR.
