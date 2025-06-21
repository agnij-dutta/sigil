import Arweave from 'arweave';

export interface ArweaveConfig {
  host: string;
  port: number;
  protocol: string;
  timeout?: number;
  logging?: boolean;
}

export interface ArweaveUploadResult {
  id: string;
  status: string;
  timestamp: number;
  size: number;
  cost: string;
}

export class ArweaveStorageClient {
  private arweave: Arweave;
  private wallet: any;

  constructor(config: ArweaveConfig, wallet?: any) {
    this.arweave = Arweave.init(config);
    this.wallet = wallet;
  }

  async uploadData(data: any, tags?: Array<{ name: string; value: string }>): Promise<ArweaveUploadResult> {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const transaction = await this.arweave.createTransaction({ data: dataString }, this.wallet);

      if (tags) {
        tags.forEach(tag => {
          transaction.addTag(tag.name, tag.value);
        });
      }

      await this.arweave.transactions.sign(transaction, this.wallet);
      
      const uploader = await this.arweave.transactions.getUploader(transaction);
      
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
      }

      return {
        id: transaction.id,
        status: 'pending',
        timestamp: Date.now(),
        size: transaction.data_size,
        cost: this.arweave.ar.winstonToAr(transaction.reward)
      };
    } catch (error) {
      throw new Error(`Arweave upload failed: ${error.message}`);
    }
  }

  async retrieveData(transactionId: string): Promise<any> {
    try {
      const transaction = await this.arweave.transactions.get(transactionId);
      const data = transaction.get('data', { decode: true, string: true });
      
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      throw new Error(`Arweave retrieval failed: ${error.message}`);
    }
  }

  async getTransactionStatus(transactionId: string): Promise<string> {
    try {
      const status = await this.arweave.transactions.getStatus(transactionId);
      return status.status === 200 ? 'confirmed' : 'pending';
    } catch (error) {
      return 'not_found';
    }
  }

  async estimateCost(dataSize: number): Promise<string> {
    try {
      const price = await this.arweave.transactions.getPrice(dataSize);
      return this.arweave.ar.winstonToAr(price);
    } catch (error) {
      throw new Error(`Cost estimation failed: ${error.message}`);
    }
  }
} 