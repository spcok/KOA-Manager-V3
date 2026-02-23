import { dataService } from './dataService';
import { LocalBackupEntry } from '../types';

export const backupService = {
  generateFullBackup: async () => {
    const [
      animals, tasks, users, siteLogs, incidents, 
      firstAidLogs, timeLogs, foodOptions, 
      feedMethods, locations, contacts, orgProfile
    ] = await Promise.all([
      dataService.fetchAnimals(),
      dataService.fetchTasks(),
      dataService.fetchUsers(),
      dataService.fetchSiteLogs(),
      dataService.fetchIncidents(),
      dataService.fetchFirstAidLogs(),
      dataService.fetchTimeLogs(),
      dataService.fetchFoodOptions(),
      dataService.fetchFeedMethods(),
      dataService.fetchLocations(),
      dataService.fetchContacts(),
      dataService.fetchOrgProfile()
    ]);

    return {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      data: {
        animals, tasks, users, siteLogs, incidents,
        firstAidLogs, timeLogs, foodOptions,
        feedMethods, locations, contacts, orgProfile
      }
    };
  },

  exportDatabase: async () => {
    const backup = await backupService.generateFullBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KOA_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importDatabase: async (jsonString: string) => {
    try {
      const backup = JSON.parse(jsonString);
      if (!backup.data) throw new Error('Invalid backup format');

      const d = backup.data;

      // Batch updates
      const promises = [];
      if (d.animals) promises.push(dataService.saveAnimalsBulk(d.animals));
      if (d.tasks) promises.push(dataService.saveTasks(d.tasks));
      if (d.users) promises.push(dataService.saveUsers(d.users));
      if (d.siteLogs) {
        for (const log of d.siteLogs) promises.push(dataService.saveSiteLog(log));
      }
      if (d.incidents) {
        for (const inc of d.incidents) promises.push(dataService.saveIncident(inc));
      }
      if (d.firstAidLogs) {
        for (const fa of d.firstAidLogs) promises.push(dataService.saveFirstAidLog(fa));
      }
      if (d.timeLogs) {
        for (const tl of d.timeLogs) promises.push(dataService.saveTimeLog(tl));
      }
      if (d.foodOptions) promises.push(dataService.saveFoodOptions(d.foodOptions));
      if (d.feedMethods) promises.push(dataService.saveFeedMethods(d.feedMethods));
      if (d.locations) promises.push(dataService.saveLocations(d.locations));
      if (d.contacts) promises.push(dataService.saveContacts(d.contacts));
      if (d.orgProfile) promises.push(dataService.saveOrgProfile(d.orgProfile));

      await Promise.all(promises);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  // --- INTERNAL RESTORE POINTS ---
  
  createLocalSnapshot: async (): Promise<LocalBackupEntry | null> => {
    try {
      const fullData = await backupService.generateFullBackup();
      const jsonString = JSON.stringify(fullData);
      
      const snapshot: LocalBackupEntry = {
        id: `snap_${Date.now()}`,
        timestamp: Date.now(),
        size: jsonString.length,
        data: jsonString
      };

      await dataService.saveLocalBackup(snapshot);
      return snapshot;
    } catch (e) {
      console.error("Snapshot creation failed", e);
      return null;
    }
  },

  restoreFromSnapshot: async (snapshot: LocalBackupEntry): Promise<boolean> => {
    if (!snapshot.data) return false;
    return await backupService.importDatabase(snapshot.data);
  }
};