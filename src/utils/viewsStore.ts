import { Database } from "bun:sqlite";

type ViewCountRow = {
  session: string;
  views: number;
};

class ViewsStore {
  db: Database;

  constructor() {
    this.db = new Database("animepahe.sqlite", { create: true });
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS anime_views (
        session TEXT PRIMARY KEY,
        views INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
    `);
  }

  recordView(session: string) {
    if (!session) return;
    const now = new Date().toISOString();
    this.db
      .prepare(
        `
        INSERT INTO anime_views (session, views, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT(session) DO UPDATE SET
          views = views + 1,
          updated_at = excluded.updated_at
      `,
      )
      .run(session, now);
  }

  getViewCounts(sessions: string[]) {
    const validSessions = sessions.filter(Boolean);
    if (validSessions.length === 0) {
      return new Map<string, number>();
    }

    const placeholders = validSessions.map(() => "?").join(",");
    const query = `
      SELECT session, views
      FROM anime_views
      WHERE session IN (${placeholders})
    `;
    const rows = this.db.prepare(query).all(...validSessions) as ViewCountRow[];
    return new Map(rows.map((row) => [row.session, row.views]));
  }

  getTopViewed(limit: number, offset: number) {
    const totalRow = this.db
      .prepare(`SELECT COUNT(*) as total FROM anime_views`)
      .get() as { total: number };

    const rows = this.db
      .prepare(
        `
        SELECT session, views
        FROM anime_views
        ORDER BY views DESC, updated_at DESC
        LIMIT ? OFFSET ?
      `,
      )
      .all(limit, offset) as ViewCountRow[];

    return {
      total: totalRow?.total ?? 0,
      rows,
    };
  }
}

export default new ViewsStore();
