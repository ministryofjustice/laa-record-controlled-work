import { requireAuth } from '#middleware/requireAuth.js';
import { expect } from 'chai';
import type { Request, Response } from 'express';
import sinon from 'sinon';

describe('requireAuth', () => {
    afterEach(() => sinon.restore());

    it('unauthenticated request redirects to `/auth/signin`', () => {
        const req = {} as Request;
        const redirect = sinon.stub();
        const res = { redirect } as Partial<Response>;
        const next = sinon.stub();

        requireAuth(req, res as Response, next);

        expect(redirect.calledOnceWith('/auth/signin')).to.be.true;
        expect(next.called).to.be.false;
    });

    it('Authenticated request with isAuthenticated being true calls next()', () => {
        const session = { isAuthenticated: true } as Request['session'];
        const req: Partial<Request> = { session: session };
        const redirect = sinon.stub();
        const res = { redirect } as Partial<Response>;
        const next = sinon.stub();

        requireAuth(req as Request, res as Response, next);

        expect(next.called).to.be.true;
        expect(redirect.calledWith('/auth/signin')).to.be.false;
    });
});