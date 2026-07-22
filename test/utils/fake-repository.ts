type Row = { id?: number } & Record<string, any>;

function matches(row: Row, where: any): boolean {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

function applyWhere(rows: Row[], opts: any): Row[] {
  if (!opts || !opts.where) return [...rows];
  const wheres = Array.isArray(opts.where) ? opts.where : [opts.where];
  return rows.filter((row) => wheres.some((w: any) => matches(row, w)));
}

/**
 * Minimal in-memory stand-in for a TypeORM Repository, used to exercise the
 * real HTTP pipeline (routing, guards, pipes, controller, service) in
 * functional tests without needing a live database connection.
 *
 * `populate` mimics TypeORM's `relations` option: it runs on every row
 * returned by find/findOne/findOneBy so relation-dependent business logic
 * (e.g. checking `harvest.productionCycle.status`) works against rows
 * joined from other fake repositories.
 */
export function createFakeRepository<T extends Row>(seed: T[] = [], populate?: (row: Row) => Row) {
  let rows: Row[] = seed.map((r) => ({ ...r }));
  let nextId = rows.reduce((max, r) => Math.max(max, r.id ?? 0), 0) + 1;
  const withRelations = (row: Row | undefined | null) => (row ? (populate ? populate(row) : row) : row);

  return {
    create: jest.fn((dto: any) => ({ ...dto })),
    save: jest.fn(async (entity: any) => {
      if (entity.id == null) {
        entity = { ...entity, id: nextId++ };
        rows.push(entity);
      } else {
        const idx = rows.findIndex((r) => r.id === entity.id);
        if (idx >= 0) rows[idx] = { ...rows[idx], ...entity };
        else rows.push(entity);
      }
      return entity;
    }),
    find: jest.fn(async (opts?: any) => applyWhere(rows, opts).map((r) => withRelations(r)!)),
    findOne: jest.fn(async (opts?: any) => withRelations(applyWhere(rows, opts)[0] ?? null)),
    findOneBy: jest.fn(async (where: any) => withRelations(rows.find((r) => matches(r, where)) ?? null)),
    count: jest.fn(async (opts?: any) => applyWhere(rows, opts).length),
    remove: jest.fn(async (entity: any) => {
      rows = rows.filter((r) => r.id !== entity.id);
      return entity;
    }),
    softRemove: jest.fn(async (entity: any) => {
      const removed = { ...entity, deletedAt: new Date() };
      const idx = rows.findIndex((r) => r.id === entity.id);
      if (idx >= 0) rows[idx] = removed;
      return removed;
    }),
    update: jest.fn(async (id: any, partial: any) => {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) rows[idx] = { ...rows[idx], ...partial };
    }),
    rows: () => rows,
  };
}
