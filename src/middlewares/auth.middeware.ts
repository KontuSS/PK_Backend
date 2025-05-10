import { Context } from 'hono';
import { jwt } from 'hono/jwt';
import { config } from '../config/constants.js';

export const authMiddleware = jwt({
  secret: config.JWT_SECRET,
  cookie: 'token',
});

// Role-based access control
export const roleMiddleware = (roles: string[]) => {
  return async (c: Context, next: Function) => {
    const payload = c.get('jwtPayload');
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
      columns: { role: true },
    });

    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    await next();
  };
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return async (c: Context, next: Function) => {
    const data = await c.req.json();
    const { error } = schema.validate(data);
    if (error) {
      return c.json({ error: error.details[0].message }, 400);
    }
    c.set('validatedData', data);
    await next();
  };
};