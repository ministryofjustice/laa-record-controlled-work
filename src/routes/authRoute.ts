import { msalConfig } from '#src/config/authConfig.js';
import { AuthService } from '#src/services/authService.js';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Router, type NextFunction, type Request, type Response } from 'express';

const router: Router = Router();



router.get('/signin', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const msalClient = new ConfidentialClientApplication(msalConfig);
        const authService = AuthService.create(req.session, msalClient);
        const url = await authService.getAuthCodeUrl(req.session);
        res.redirect(url);
    } catch (error) {
        next(error);
    }
});

export default router;
