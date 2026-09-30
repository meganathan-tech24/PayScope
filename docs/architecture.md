# Architecture

Diagrams for what is built. They use Mermaid, which GitHub renders. Reasons for each choice are in [design-notes.md](design-notes.md).

## 1. System overview

The browser loads the React app from Vercel and calls the Express API on Render directly. The API is the only thing that talks to PostgreSQL.

```mermaid
flowchart LR
  B[Browser] -->|HTML, JS| W[React app<br/>Vercel]
  B -->|HTTPS + Bearer JWT| A[Express API<br/>Render]
  A -->|Prisma, SQL| D[(PostgreSQL<br/>managed)]
  A -.->|logs| L[(ApplicationLog<br/>table)]
```

Locally the same three parts run with `pnpm dev` and `docker compose` (Postgres). The API allows only the web app's origin (CORS). Dashboard settings on Vercel and Render were not checked by me; see Known limitations in the design notes.

## 2. Backend request flow

Every request passes the same middleware, then a thin controller, a service that applies the role rules, and a repository. Any error goes to one handler.

```mermaid
flowchart TD
  R[Request] --> H[helmet, CORS]
  H --> ID[request id]
  ID --> RL[rate limit]
  RL --> J[JSON parser]
  J --> AU[authenticate<br/>employees, insights]
  AU --> AZ[authorize<br/>writes, outliers]
  AZ --> V[validate zod]
  V --> C[controller]
  C --> S[service<br/>role-based shape]
  S --> RP[repository]
  RP --> DB[(PostgreSQL)]
  V -. invalid .-> E[error handler]
  S -. AppError .-> E
  RP -. DB error .-> E
  E --> LG[logger]
  LG --> CO[console JSON]
  LG --> DT[database transport]
  E --> RES[safe error envelope]
```

`authorize` runs before `validate`, so a Viewer gets 403 before their input is examined. Auth routes are not behind `authenticate`; register and login have an extra limiter (10 per 15 minutes). The logger redacts passwords, tokens and headers once, before both outputs.

## 3. Role-based data flow

The service decides what leaves the server, from the role in the token. A controller never sees a raw row.

```mermaid
flowchart LR
  T[JWT: id, role] --> S{service}
  S -->|HR_MANAGER| F[Full employee<br/>with salary]
  S -->|VIEWER| DIR[Directory employee<br/>no salary key]
  S -->|HR_MANAGER| CF[CSV with salary column]
  S -->|VIEWER| CD[CSV without salary column]
  S -->|HR_MANAGER| IF[Stats with min and max<br/>bands on exact edges<br/>outliers]
  S -->|VIEWER| ID2[Stats without min and max<br/>groups under 5 hidden, counted<br/>bands on rounded edges<br/>outliers 403]
```

A Viewer who sorts or filters by salary gets a 400. The Viewer shape is built from an allowlist, so a new database column is not exposed by accident.

## 4. Data model

Three tables. There are no foreign keys: `ApplicationLog.userId` is a plain string so that logging never fails on a missing user.

```mermaid
erDiagram
  User {
    uuid id PK
    string email UK
    string passwordHash
    string name
    Role role
  }
  Employee {
    uuid id PK
    string fullName
    string email UK
    string jobTitle
    string department
    string country
    string currency
    int salary "minor units"
    date hireDate
    EmploymentType employmentType
  }
  ApplicationLog {
    uuid id PK
    LogLevel level
    string message
    string requestId
    string userId "no FK"
    json metadata
  }
```

Enums: Role (`HR_MANAGER`, `VIEWER`), EmploymentType, LogLevel. Employee has indexes on country, department, jobTitle, salary and (country, jobTitle), and a check that salary is not negative. Columns are shortened here; the full list is in `apps/api/prisma/schema.prisma`.

## 5. Monorepo layout

Apps never import each other. They share code only through `packages/*`. All tests live in `tests/`.

```mermaid
flowchart TD
  WEB[apps/web] --> SH[packages/shared]
  WEB --> TY[packages/types]
  API[apps/api] --> SH
  API --> TY
  TS[tests] --> WEB
  TS --> API
  TS --> SH
  TS --> TY
  CFG[packages/eslint-config<br/>packages/typescript-config] -.-> WEB
  CFG -.-> API
```

```text
apps/web        React: features/{landing,auth,employees,insights}, pages/
apps/api        Express: modules/{auth,employees,insights}, prisma/ (health route lives in app/routes.ts)
packages/       shared, types, eslint-config, typescript-config
tests/          api/{unit,integration,setup}, web, packages, helpers, factories, e2e (empty)
scripts/        test-location guard, production smoke check
docs/           requirements, design notes, architecture, AI prompts, demo script
```
