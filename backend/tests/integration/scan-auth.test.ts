import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { prisma } from '../../src/db/client.js';
import { redisConnection } from '../../src/jobs/queue.js';
import jwt from 'jsonwebtoken';

describe('Anonymous Scanning & Auth', () => {
  let publicRepoId: string;
  let privateRepoId: string;
  let userToken: string;

  beforeAll(async () => {
    await redisConnection.flushall();
    await prisma.fileScore.deleteMany();
    await prisma.scan.deleteMany();
    await prisma.repo.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        githubId: 'test-github-id',
        username: 'testuser',
        accessTokenEnc: 'test-token',
      }
    });
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_here';
    userToken = jwt.sign({ userId: user.id }, secret);

    const publicRepo = await prisma.repo.create({
      data: {
        githubRepoId: 'public-repo',
        owner: 'testowner',
        name: 'public',
        fullName: 'testowner/public',
        defaultBranch: 'main',
        isPrivate: false,
      }
    });
    publicRepoId = publicRepo.id;

    const privateRepo = await prisma.repo.create({
      data: {
        githubRepoId: 'private-repo',
        owner: 'testowner',
        name: 'private',
        fullName: 'testowner/private',
        defaultBranch: 'main',
        isPrivate: true,
        connectedById: user.id
      }
    });
    privateRepoId = privateRepo.id;
  });

  afterAll(async () => {
    await prisma.fileScore.deleteMany();
    await prisma.scan.deleteMany();
    await prisma.repo.deleteMany();
    await prisma.user.deleteMany();
  });

  it('allows anonymous scan of a public repo', async () => {
    const res = await request(app)
      .post(`/api/repos/${publicRepoId}/scans`);
    
    expect(res.status).toBe(202);
    
    const scan = await prisma.scan.findUnique({ where: { id: res.body.scanId } });
    expect(scan?.isAnonymous).toBe(true);
    expect(scan?.requestedById).toBeNull();
  });

  it('forces explanationsRequested to false for anonymous scans', async () => {
    const res = await request(app)
      .post(`/api/repos/${publicRepoId}/scans`)
      .send({ explanationsRequested: true });
    
    expect(res.status).toBe(202);
    
    const scan = await prisma.scan.findUnique({ where: { id: res.body.scanId } });
    expect(scan?.isAnonymous).toBe(true);
    expect(scan?.explanationsRequested).toBe(false);
  });

  it('rejects anonymous scan of a private repo with 401', async () => {
    const res = await request(app)
      .post(`/api/repos/${privateRepoId}/scans`);
    
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('allows authenticated scan of a private repo', async () => {
    const res = await request(app)
      .post(`/api/repos/${privateRepoId}/scans`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(202);
    
    const scan = await prisma.scan.findUnique({ where: { id: res.body.scanId } });
    expect(scan?.isAnonymous).toBe(false);
    expect(scan?.requestedById).not.toBeNull();
  });

  it('rate limits anonymous scans', async () => {
    // Clear redis so we start from 0 for this specific test
    await redisConnection.flushall();
    
    // We can do 5 anonymous scans
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post(`/api/repos/${publicRepoId}/scans`);
      expect(res.status).toBe(202);
    }
    
    // 6th should fail (limit is 5)
    const resLimit = await request(app).post(`/api/repos/${publicRepoId}/scans`);
    expect(resLimit.status).toBe(429);
    expect(resLimit.body.error).toContain('Rate limit exceeded');
  });
});
