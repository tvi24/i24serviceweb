# Integration Boundaries

The workshop delivers **Web Portal intake** and the **in-app Central Alert Center** as working features. Mail, LINE OA, Phone/Quick Call, and outbound external notifications are NOT implemented as live integrations; they are documented boundaries so future adapters can attach without changing delivered scope. (R11)

## Inbound intake adapter contract

Every future inbound channel maps its payload to the internal intake command:

```
IntakeCommand {
  title: string (1..200, required)
  description: string (1..5000, required)
  reporter: { externalId, displayName }   // resolved/mapped to a user
  channel: 'mail' | 'line' | 'phone'
  idempotencyKey?: string
  attachments?: [...]                       // out of scope for workshop
}
```

Required behavior for any adapter (mirrors R1/EX-04/EX-05):
- **Input data**: must supply title + description + reporter identity; otherwise request additional information before ticket creation.
- **Validation outcome**: same zod validation as `POST /api/incidents`; invalid → reject with field-level reasons, no ticket.
- **Duplicate handling**: honor `idempotencyKey`; if repeated → return existing `ticketId` with duplicate warning, no new ticket. Apply duplicate-criteria match otherwise.
- **Authentication expectation**: channel adapter authenticates the sender out-of-band and maps to a synthetic user; internal call is service-authenticated.
- **Response outcome**: return `{ ticketId }` + confirmation message to the channel.

Adapters live behind `intakeService.createFromChannel(cmd)`; the web portal uses the same service via `POST /api/incidents`.

## Outbound notification adapter contract

The Central Alert Center is the in-app source of truth. A future outbound notifier consumes alert events:

```
NotifyEvent {
  alertId, incidentId, type, severity, message,
  recipient: { role?, userId? }, createdAt
}
```

Required behavior:
- Subscribe to alert creation (in-app first). Delivery channels (mail/LINE/SMS) map `NotifyEvent` to channel messages.
- Absence of any outbound adapter MUST NOT block alert creation or portal/alert-center operation (R11.6).
- Delivery attempts/results would be recorded as audit events by the adapter (future).

## AI provider integration (delivered, optional)

- `aiAdapter` interface with `rules` (default, no external dependency) and `bedrock` (optional) implementations.
- Bedrock adapter reads credentials from env/secret store only; when unavailable or `AI_PROVIDER=rules`, the rules/mock path is used (R3.4).
- All AI output is labeled as a recommendation requiring authorized staff review (R3.3).

## Boundary summary table

| Channel | Direction | Workshop status | Contract |
|---|---|---|---|
| Web Portal | inbound | Working | `POST /api/incidents` |
| Central Alert Center | in-app | Working | `GET /api/alerts`, ack |
| Mail | inbound | Boundary only | IntakeCommand |
| LINE OA | inbound | Boundary only | IntakeCommand |
| Phone/Quick Call | inbound | Boundary only | IntakeCommand |
| Outbound notify (mail/LINE/SMS) | outbound | Boundary only | NotifyEvent |
| Bedrock AI | internal | Optional (env-gated) | aiAdapter |
