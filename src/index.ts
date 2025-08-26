import { Hono, Context, Next } from "hono";
import { cors } from "hono/cors";
import { handleRest } from './rest';
import { themes } from './themes';

export interface Env {
    DB: D1Database;
    SECRET: SecretsStoreSecret;
}

// # List all users
// GET /rest/users

// # Get filtered and sorted users
// GET /rest/users?age=25&sort_by=name&order=desc

// # Get paginated results
// GET /rest/users?limit=10&offset=20

// # Create a new user
// POST /rest/users
// { "name": "John", "age": 30 }

// # Update a user
// PATCH /rest/users/123
// { "age": 31 }

// # Delete a user
// DELETE /rest/users/123

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const app = new Hono<{ Bindings: Env }>();

        // Apply CORS to all routes
        app.use('*', async (c: Context<{ Bindings: Env }>, next: Next) => {
            return cors()(c, next);
        })

        // Secret Store key value that we have set
        const secret = await env.SECRET.get();

        // Authentication middleware that verifies the Authorization header
        // is sent in on each request and matches the value of our Secret key.
        // If a match is not found we return a 401 and prevent further access.
        const authMiddleware = async (c: Context, next: Next) => {
            const authHeader = c.req.header('Authorization');
            if (!authHeader) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const token = authHeader.startsWith('Bearer ')
                ? authHeader.substring(7)
                : authHeader;

            if (token !== secret) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            return next();
        };

        // CRUD REST endpoints made available to all of our tables
        // Public READ-ONLY mirror for the HTML viewer (no auth, GET only)
        app.get('/public/rest/*', handleRest);

        // Protected endpoints (require Bearer token)
        app.all('/rest/*', authMiddleware, handleRest);

        // Execute a raw SQL statement with parameters with this route
        app.post('/query', authMiddleware, async (c: Context<{ Bindings: Env }>) => {
            try {
                const body = await c.req.json();
                const { query, params } = body;

                if (!query) {
                    return c.json({ error: 'Query is required' }, 400);
                }

                // Execute the query against D1 database
                const results = await env.DB.prepare(query)
                    .bind(...(params || []))
                    .all();

                return c.json(results);
            } catch (error: any) {
                return c.json({ error: error.message }, 500);
            }
        });

        // Public endpoint to serve themes (no Authorization header required)
        app.get('/public/themes', async (c: Context<{ Bindings: Env }>) => {
            return c.json(themes);
        });

        // Public endpoint to submit QCM results (no Authorization header required)
        app.post('/public/qcm', async (c: Context<{ Bindings: Env }>) => {
            try {
                // Optional lightweight origin check (best-effort)
                const origin = c.req.header('Origin') || '';
                const url = new URL(c.req.url);
                if (origin && origin !== `${url.protocol}//${url.host}`) {
                    return c.json({ error: 'Forbidden origin' }, 403);
                }

                const body = await c.req.json();
                if (!body || typeof body !== 'object') {
                    return c.json({ error: 'Invalid JSON body' }, 400);
                }

                // Whitelist expected fields
                const session_id = String(body.session_id || '').slice(0, 128);
                const started_at = body.started_at ? String(body.started_at) : null;
                const completed_at = body.completed_at ? String(body.completed_at) : null;
                const num_themes = Number.isFinite(Number(body.num_themes)) ? Number(body.num_themes) : null;
                const num_questions_total = Number.isFinite(Number(body.num_questions_total)) ? Number(body.num_questions_total) : null;
                const num_correct_total = Number.isFinite(Number(body.num_correct_total)) ? Number(body.num_correct_total) : null;
                const themes = Array.isArray(body.themes) ? JSON.stringify(body.themes) : null;

                if (!session_id || !completed_at) {
                    return c.json({ error: 'Missing required fields: session_id, completed_at' }, 400);
                }

                const sql = `INSERT INTO quiz_sessions
                    (session_id, started_at, completed_at, num_themes, num_questions_total, num_correct_total, themes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;

                await c.env.DB.prepare(sql)
                    .bind(
                        session_id,
                        started_at,
                        completed_at,
                        num_themes,
                        num_questions_total,
                        num_correct_total,
                        themes,
                    )
                    .run();

                return c.json({ ok: true }, 201);
            } catch (error: any) {
                return c.json({ error: error.message || String(error) }, 500);
            }
        });

        // Static assets and default route
        app.get('/', (c: Context) => c.redirect('/viewer.html', 302));

        return app.fetch(request, env, ctx);
    }
} satisfies ExportedHandler<Env>;
