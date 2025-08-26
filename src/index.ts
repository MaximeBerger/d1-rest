import { Hono, Context, Next } from "hono";
import { cors } from "hono/cors";
import { handleRest } from './rest';

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
    async fetch(request: Request, env: Env): Promise<Response> {
      const url = new URL(request.url);
  
      // CORS
      const origin = request.headers.get("Origin") || "*";
      const cors = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      };
  
      // Préflight CORS
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
      }
  
      // POST /rest/scores
      if (url.pathname === "/rest/scores" && request.method === "POST") {
        try {
          const body = await request.json();
          const { external_id, session, theme_code, score, max_score } = body as { external_id: string, session: string, theme_code: string, score: number, max_score: number };
  
          if (!external_id || !theme_code || !(max_score > 0) || !(score >= 0)) {
            return json({ error: "Champs invalides" }, 400, cors);
          }
  
          // Schéma
          await env.DB.exec(`CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, external_id TEXT UNIQUE)`);
  
          await env.DB.exec(`CREATE TABLE IF NOT EXISTS sujet (id INTEGER PRIMARY KEY AUTOINCREMENT, session TEXT NOT NULL, theme TEXT NOT NULL, UNIQUE(session, theme))`);
  
          await env.DB.exec(`CREATE TABLE IF NOT EXISTS student_theme_scores (student_id INTEGER NOT NULL, theme_id INTEGER NOT NULL, score INTEGER NOT NULL, max_score INTEGER NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (student_id, theme_id))`);
  
          // Référentiels
          await env.DB.prepare(
            `INSERT OR IGNORE INTO students(external_id) VALUES (?)`
          ).bind(external_id).run();
  
          await env.DB.prepare(
            `INSERT OR IGNORE INTO sujet(session, theme) VALUES (?, ?)`
          ).bind(session, theme_code).run();
  
          // IDs
          const s = await env.DB.prepare(
            `SELECT id FROM students WHERE external_id=?`
          ).bind(external_id).first();
  
          const t = await env.DB.prepare(
            `SELECT id FROM sujet WHERE session=? AND theme=?`
          ).bind(session, theme_code).first();
  
          // UPSERT
          await env.DB.prepare(
            `INSERT INTO student_theme_scores (student_id, theme_id, score, max_score, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(student_id, theme_id) DO UPDATE SET score = excluded.score, max_score = excluded.max_score, updated_at = datetime('now')`
          ).bind(s?.id, t?.id, score, max_score).run();
  
          return json({ ok: true, external_id, theme_code, score, max_score }, 200, cors);
  
        } catch (e: any) {
          return json({ error: e.message }, 500, cors);
        }
      }
  
      // GET /rest/scores
      if (url.pathname === "/rest/scores" && request.method === "GET") {
        return json({ ok: true, ping: "pong" }, 200, cors);
      }
  
      return new Response("Not found", { status: 404, headers: cors });
    }
  };
  
  // Helper JSON
  function json(data: any, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", ...headers }
    });
  }  
