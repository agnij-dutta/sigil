import { ArweaveStorageClient } from '../arweave/client.js';
import { IPFSClient } from '../ipfs/client.js';

export interface StorageStrategy {
  name: 'ipfs' | 'arweave' | 'hybrid';
  priority: number;
  criteria: {
    maxSize?: number;
    isPermanent?: boolean;
    isFrequentAccess?: boolean;
    costSensitive?: boolean;
  };
}

export interface StorageResult {
  id: string;
  strategy: string;
  redundancy: string[];
  cost: string;
  retrievalSpeed: 'fast' | 'medium' | 'slow';
}

export class HybridStorageRouter {
  private ipfsClient: IPFSClient;
  private arweaveClient: ArweaveStorageClient;
  private strategies: StorageStrategy[];

  constructor(ipfsClient: IPFSClient, arweaveClient: ArweaveStorageClient) {
    this.ipfsClient = ipfsClient;
    this.arweaveClient = arweaveClient;
    this.strategies = this.initializeStrategies();
  }

  private initializeStrategies(): StorageStrategy[] {
    return [
      {
        name: 'ipfs',
        priority: 1,
        criteria: {
          maxSize: 100 * 1024 * 1024, // 100MB
          isFrequentAccess: true,
          costSensitive: true
        }
      },
      {
        name: 'arweave',
        priority: 2,
        criteria: {
          isPermanent: true,
          isFrequentAccess: false
        }
      },
      {
        name: 'hybrid',
        priority: 3,
        criteria: {
          maxSize: 1024 * 1024 * 1024, // 1GB
          isPermanent: true,
          isFrequentAccess: true
        }
      }
    ];
  }

  async storeData(
    data: any, 
    options: {
      permanent?: boolean;
      frequentAccess?: boolean;
      costSensitive?: boolean;
      redundancy?: number;
    } = {}
  ): Promise<StorageResult> {
    const dataSize = this.calculateDataSize(data);
    const strategy = this.selectOptimalStrategy(dataSize, options);

    switch (strategy.name) {
      case 'ipfs':
        return await this.storeInIPFS(data, options);
      
      case 'arweave':
        return await this.storeInArweave(data, options);
      
      case 'hybrid':
        return await this.storeHybrid(data, options);
      
      default:
        throw new Error(`Unknown storage strategy: ${strategy.name}`);
    }
  }

  private selectOptimalStrategy(dataSize: number, options: any): StorageStrategy {
    for (const strategy of this.strategies) {
      if (this.matchesCriteria(strategy, dataSize, options)) {
        return strategy;
      }
    }
    return this.strategies[0]; // Default to IPFS
  }

  private matchesCriteria(strategy: StorageStrategy, dataSize: number, options: any): boolean {
    const { criteria } = strategy;

    if (criteria.maxSize && dataSize > criteria.maxSize) return false;
    if (criteria.isPermanent !== undefined && criteria.isPermanent !== options.permanent) return false;
    if (criteria.isFrequentAccess !== undefined && criteria.isFrequentAccess !== options.frequentAccess) return false;
    if (criteria.costSensitive !== undefined && criteria.costSensitive !== options.costSensitive) return false;

    return true;
  }

  private async storeInIPFS(data: any, options: any): Promise<StorageResult> {
    const result = await this.ipfsClient.uploadEncrypted(data);
    
    return {
      id: result.hash,
      strategy: 'ipfs',
      redundancy: [`ipfs:${result.hash}`],
      cost: '0.00',
      retrievalSpeed: 'fast'
    };
  }

  private async storeInArweave(data: any, options: any): Promise<StorageResult> {
    const result = await this.arweaveClient.uploadData(data, [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'Sigil' }
    ]);

    return {
      id: result.id,
      strategy: 'arweave',
      redundancy: [`arweave:${result.id}`],
      cost: result.cost,
      retrievalSpeed: 'slow'
    };
  }

  private async storeHybrid(data: any, options: any): Promise<StorageResult> {
    // Store in both IPFS (fast access) and Arweave (permanence)
    const [ipfsResult, arweaveResult] = await Promise.all([
      this.storeInIPFS(data, options),
      this.storeInArweave(data, options)
    ]);

    return {
      id: ipfsResult.id, // Primary reference
      strategy: 'hybrid',
      redundancy: [
        `ipfs:${ipfsResult.id}`,
        `arweave:${arweaveResult.id}`
      ],
      cost: arweaveResult.cost,
      retrievalSpeed: 'fast'
    };
  }

  async retrieveData(storageResult: StorageResult): Promise<any> {
    // Try fastest option first
    const sortedRedundancy = storageResult.redundancy.sort((a, b) => {
      if (a.startsWith('ipfs:')) return -1;
      if (b.startsWith('ipfs:')) return 1;
      return 0;
    });

    for (const location of sortedRedundancy) {
      try {
        const [type, id] = location.split(':');
        
        if (type === 'ipfs') {
          return await this.ipfsClient.retrieveDecrypted(id);
        } else if (type === 'arweave') {
          return await this.arweaveClient.retrieveData(id);
        }
      } catch (error) {
        console.warn(`Failed to retrieve from ${location}:`, error.message);
        continue;
      }
    }

    throw new Error('Failed to retrieve data from all storage locations');
  }

  private calculateDataSize(data: any): number {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return new Blob([dataString]).size;
  }
} 