export { };

declare global {
    namespace Express {
        interface UserPayload {
            id: number;
            userId: number;
            tenantId: number;
            email: string;
            role: string;
            jti?: string;
        }

        interface Request {
            user?: UserPayload;
            id?: string;
        }
    }
}
