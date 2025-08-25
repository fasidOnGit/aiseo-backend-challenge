export interface Initializer {
  name: string;
  initialize(): Promise<void> | void;
  cleanup?(): Promise<void> | void;
}

export class AppInitializer {
  private initializers: Initializer[] = [];
  private initialized = false;

  /**
   * Register an initializer
   */
  register(initializer: Initializer): void {
    this.initializers.push(initializer);
  }

  /**
   * Initialize all registered initializers in order
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('App already initialized');
      return;
    }

    console.log('🚀 Initializing application...');

    for (const initializer of this.initializers) {
      try {
        console.log(`  📋 Initializing ${initializer.name}...`);
        await initializer.initialize();
        console.log(`  ✅ ${initializer.name} initialized successfully`);
      } catch (error) {
        console.error(`  ❌ Failed to initialize ${initializer.name}:`, error);
        throw error;
      }
    }

    this.initialized = true;
    console.log('🎉 Application initialization completed');
  }

  /**
   * Cleanup all initializers in reverse order
   */
  async cleanup(): Promise<void> {
    if (!this.initialized) return;

    console.log('🧹 Cleaning up application...');

    for (const initializer of this.initializers.reverse()) {
      if (initializer.cleanup) {
        try {
          console.log(`  📋 Cleaning up ${initializer.name}...`);
          await initializer.cleanup();
          console.log(`  ✅ ${initializer.name} cleaned up successfully`);
        } catch (error) {
          console.error(`  ❌ Failed to cleanup ${initializer.name}:`, error);
        }
      }
    }

    this.initialized = false;
    console.log('🎉 Application cleanup completed');
  }
}

// Export singleton instance
export const appInitializer = new AppInitializer();
