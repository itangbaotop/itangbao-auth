// src/lib/db/index.ts (推荐的最终版本)
import { drizzle, DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

// 声明一个全局变量来缓存数据库实例
let _db: DrizzleD1Database<typeof schema>;

// 导出一个函数，它接收一个 D1 绑定并返回 Drizzle 实例
export function getDb(d1Binding: D1Database) {
  if (!_db) {
    _db = drizzle(d1Binding, { schema });
  }
  return _db;
}