import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { setRepositoriesForTest } from '../src/repositories';
import { createMemoryRepositories } from '../src/repositories/memory';

let app: Express;

async function token(username: string) {
  const res = await request(app).post('/api/auth/login').send({ username, password: 'Passw0rd!' });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

beforeAll(() => {
  setRepositoriesForTest(createMemoryRepositories());
  app = createApp();
});

// UAT Scenario B — Email ticket end-to-end.
describe('email ticketing (Scenario B)', () => {
  it('creates an incident from a verified inbound email + records inbound + acknowledgement', async () => {
    const sam = await token('sam');
    const res = await request(app)
      .post('/api/email/inbound')
      .set('Authorization', `Bearer ${sam}`)
      .send({ from: 'emma@mgc.demo', subject: 'VPN keeps dropping', body: 'Cannot stay connected to the VPN.' });
    expect(res.status).toBe(201);
    expect(res.body.action).toBe('created');
    expect(res.body.ticketId).toMatch(/INC-\d{4}-\d{6}/);

    const emails = await request(app).get(`/api/incidents/${res.body.incidentId}/emails`).set('Authorization', `Bearer ${sam}`);
    expect(emails.status).toBe(200);
    const dirs = emails.body.map((m: { direction: string }) => m.direction);
    expect(dirs).toContain('inbound');
    expect(dirs).toContain('outbound'); // acknowledgement
  });

  it('rejects inbound from a non-verified sender', async () => {
    const sam = await token('sam');
    const res = await request(app)
      .post('/api/email/inbound')
      .set('Authorization', `Bearer ${sam}`)
      .send({ from: 'stranger@example.com', subject: 'hi', body: 'test' });
    expect(res.status).toBe(400);
  });

  it('links a reply to the existing incident thread instead of creating a new one', async () => {
    const sam = await token('sam');
    const first = await request(app)
      .post('/api/email/inbound')
      .set('Authorization', `Bearer ${sam}`)
      .send({ from: 'emma@mgc.demo', subject: 'Printer broken', body: 'The 3rd floor printer is jammed.' });
    const ticketId = first.body.ticketId as string;

    const reply = await request(app)
      .post('/api/email/inbound')
      .set('Authorization', `Bearer ${sam}`)
      .send({ from: 'emma@mgc.demo', subject: `Re: [${ticketId}] Printer broken`, body: 'Still not working.' });
    expect(reply.status).toBe(201);
    expect(reply.body.action).toBe('linked');
    expect(reply.body.incidentId).toBe(first.body.incidentId);
  });

  it('records an agent public reply (delivered) and an internal note (not emailed)', async () => {
    const sam = await token('sam');
    const created = await request(app)
      .post('/api/email/inbound')
      .set('Authorization', `Bearer ${sam}`)
      .send({ from: 'emma@mgc.demo', subject: 'Mailbox full', body: 'Cannot receive mail.' });
    const id = created.body.incidentId as string;

    const pub = await request(app).post(`/api/incidents/${id}/reply`).set('Authorization', `Bearer ${sam}`).send({ body: 'We are on it.', visibility: 'public' });
    expect(pub.status).toBe(200);
    expect(pub.body.direction).toBe('outbound');
    expect(pub.body.deliveryState).toBe('delivered');

    const note = await request(app).post(`/api/incidents/${id}/reply`).set('Authorization', `Bearer ${sam}`).send({ body: 'Checking Exchange quota.', visibility: 'internal' });
    expect(note.status).toBe(200);
    expect(note.body.visibility).toBe('internal');

    // Agent sees both public and internal messages in the thread.
    const agentView = await request(app).get(`/api/incidents/${id}/emails`).set('Authorization', `Bearer ${sam}`);
    expect(agentView.status).toBe(200);
    expect(agentView.body.some((m: { visibility: string }) => m.visibility === 'internal')).toBe(true);
    expect(agentView.body.some((m: { visibility: string }) => m.visibility === 'public')).toBe(true);
  });

  it('blocks non-staff from simulating inbound email', async () => {
    const emma = await token('emma');
    const res = await request(app).post('/api/email/inbound').set('Authorization', `Bearer ${emma}`).send({ from: 'emma@mgc.demo', subject: 'x', body: 'y' });
    expect(res.status).toBe(403);
  });
});
