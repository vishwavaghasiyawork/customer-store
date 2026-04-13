import cron from 'node-cron';
import orderService from './orderService.js';

class CronService {
  constructor() {
    this.tasks = new Map();
  }

  startOrderSyncCron() {
    // Run every minute: '* * * * *'
    let consecutiveErrors = 0;
    const maxErrors = 5; // Stop after 5 consecutive errors
    
    const task = cron.schedule('* * * * *', async () => {
      try {
        console.log('Running scheduled order sync...');
        await orderService.syncOrders();
        consecutiveErrors = 0; // Reset error counter on success
      } catch (error) {
        consecutiveErrors++;
        console.error(`Scheduled order sync failed (${consecutiveErrors}/${maxErrors}):`, error.message);
        
        // Stop cron job after max consecutive errors
        if (consecutiveErrors >= maxErrors) {
          console.error('Stopping order sync cron job due to repeated failures. Please check your Shopify credentials.');
          this.stopTask('orderSync');
        }
      }
    }, {
      scheduled: false
    });

    this.tasks.set('orderSync', task);
    return task;
  }

  startAllTasks() {
    console.log('Starting all cron jobs...');
    
    // Start order sync task
    const orderSyncTask = this.startOrderSyncCron();
    orderSyncTask.start();
    
    console.log('Order sync cron job started (runs every minute)');
    console.log(`Total active cron jobs: ${this.tasks.size}`);
  }

  stopAllTasks() {
    console.log('Stopping all cron jobs...');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    
    this.tasks.clear();
  }

  stopTask(taskName) {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      this.tasks.delete(taskName);
      console.log(`Stopped cron job: ${taskName}`);
      return true;
    }
    return false;
  }

  getActiveTasks() {
    return Array.from(this.tasks.keys());
  }

  isTaskRunning(taskName) {
    return this.tasks.has(taskName);
  }
}

export default new CronService();
