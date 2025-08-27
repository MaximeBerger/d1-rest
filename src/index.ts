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

      // GET /rest/scores/{external_id} - Récupérer tous les scores d'un étudiant
      if (url.pathname.startsWith("/rest/scores/") && request.method === "GET") {
        try {
          const external_id = url.pathname.split("/rest/scores/")[1];
          
          if (!external_id) {
            return json({ error: "ID étudiant manquant" }, 400, cors);
          }

          // Récupérer tous les scores de l'étudiant avec les détails des thèmes
          const scores = await env.DB.prepare(`
            SELECT 
              s.external_id,
              sts.score,
              sts.max_score,
              sts.updated_at,
              suj.theme as theme_code,
              suj.session
            FROM students s
            JOIN student_theme_scores sts ON s.id = sts.student_id
            JOIN sujet suj ON sts.theme_id = suj.id
            WHERE s.external_id = ?
            ORDER BY sts.updated_at DESC
          `).bind(external_id).all();

          return json({ 
            ok: true, 
            external_id, 
            scores: scores.results || [],
            total_themes: scores.results?.length || 0
          }, 200, cors);

        } catch (e: any) {
          return json({ error: e.message }, 500, cors);
        }
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
