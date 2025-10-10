import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

interface Activity {
  id?: number;
  title: string;
  description: string;
  date: string;
  synced: boolean;
}

interface ActivitiesDB extends DBSchema {
  activities: {
    key: number;
    value: Activity;
    indexes: { 'by-date': string };
  };
}

class Database {
  private db: IDBPDatabase<ActivitiesDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<ActivitiesDB>('ActivitiesDB', 1, {
      upgrade(db) {
        const store = db.createObjectStore('activities', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'date');
      },
    });
  }

  async addActivity(activity: Omit<Activity, 'id' | 'synced'>): Promise<number> {
    if (!this.db) await this.init();
    
    const id = await this.db!.add('activities', {
      ...activity,
      synced: false
    });
    return id as number;
  }

  async getActivities(): Promise<Activity[]> {
    if (!this.db) await this.init();
    return await this.db!.getAll('activities');
  }

  async getPendingActivities(): Promise<Activity[]> {
    if (!this.db) await this.init();
    const allActivities = await this.getActivities();
    return allActivities.filter(activity => !activity.synced);
  }

  async deleteActivity(id: number): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete('activities', id);
  }

  async markActivityAsSynced(id: number): Promise<void> {
    if (!this.db) await this.init();
    const activity = await this.db!.get('activities', id);
    if (activity) {
      await this.db!.put('activities', { ...activity, synced: true });
    }
  }

  async clearActivities(): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear('activities');
  }
}

export const db = new Database();