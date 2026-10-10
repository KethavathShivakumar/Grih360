import fs from 'fs';
import path from 'path';

const SEED_DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/grih360-data' : SEED_DATA_DIR);

export class PersistentStore {
  private static caches: Map<string, any[]> = new Map();

  private static ensureDataDir(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (DATA_DIR !== SEED_DATA_DIR && fs.existsSync(SEED_DATA_DIR)) {
      try {
        const files = fs.readdirSync(SEED_DATA_DIR);
        for (const file of files) {
          const dest = path.join(DATA_DIR, file);
          if (!fs.existsSync(dest)) {
            fs.copyFileSync(path.join(SEED_DATA_DIR, file), dest);
          }
        }
      } catch {
        // continue
      }
    }
  }

  private static getFilePath(collectionName: string): string {
    PersistentStore.ensureDataDir();
    return path.join(DATA_DIR, `${collectionName}.json`);
  }

  public static loadCollection<T = any>(collectionName: string): T[] {
    if (this.caches.has(collectionName)) {
      return this.caches.get(collectionName)!;
    }

    const filePath = this.getFilePath(collectionName);
    if (!fs.existsSync(filePath)) {
      this.caches.set(collectionName, []);
      return [];
    }

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        this.caches.set(collectionName, parsed);
        return parsed;
      }
      this.caches.set(collectionName, []);
      return [];
    } catch (err) {
      console.error(`[PersistentStore] Error reading ${collectionName}.json:`, err);
      this.caches.set(collectionName, []);
      return [];
    }
  }

  public static saveCollection(collectionName: string, items: any[]): void {
    this.caches.set(collectionName, items);
    const filePath = this.getFilePath(collectionName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {
      console.error(`[PersistentStore] Error saving ${collectionName}.json:`, err);
    }
  }

  public static find<T = any>(collectionName: string, predicate?: (item: T) => boolean): T[] {
    const all = this.loadCollection<T>(collectionName);
    if (!predicate) return [...all];
    return all.filter(predicate);
  }

  public static findOne<T = any>(collectionName: string, predicate: (item: T) => boolean): T | null {
    const all = this.loadCollection<T>(collectionName);
    const found = all.find(predicate);
    return found || null;
  }

  public static findById<T = any>(collectionName: string, id: string): T | null {
    const all = this.loadCollection<T>(collectionName);
    const found = all.find((item: any) => item._id === id || item.id === id);
    return found || null;
  }

  public static insert<T = any>(collectionName: string, doc: Partial<T> & Record<string, any>): T {
    const all = this.loadCollection<T>(collectionName);
    const now = new Date();
    const id = doc._id || doc.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const newDoc: any = {
      ...doc,
      _id: id,
      id,
      createdAt: doc.createdAt || now,
      updatedAt: now,
    };

    all.push(newDoc);
    this.saveCollection(collectionName, all);
    return newDoc;
  }

  public static update<T = any>(collectionName: string, id: string, updateData: Partial<T> & Record<string, any>): T | null {
    const all = this.loadCollection<T>(collectionName);
    const index = all.findIndex((item: any) => item._id === id || item.id === id);
    if (index === -1) return null;

    const existing = all[index];
    const updated = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };

    all[index] = updated;
    this.saveCollection(collectionName, all);
    return updated;
  }

  public static delete(collectionName: string, id: string): boolean {
    const all = this.loadCollection(collectionName);
    const initialLen = all.length;
    const filtered = all.filter((item: any) => item._id !== id && item.id !== id);
    if (filtered.length !== initialLen) {
      this.saveCollection(collectionName, filtered);
      return true;
    }
    return false;
  }

  public static count(collectionName: string, predicate?: (item: any) => boolean): number {
    const all = this.loadCollection(collectionName);
    if (!predicate) return all.length;
    return all.filter(predicate).length;
  }
}
