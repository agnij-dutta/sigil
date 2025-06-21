
// IPFS Storage Utilities for Sigil
import { create } from 'ipfs-http-client';
import PinataSDK from '@pinata/sdk';

export interface StorageResult {
  cid: string;
  gateways: {
    ipfs: string;
    pinata: string;
    cloudflare: string;
  };
}

export class SigilIPFSClient {
  private ipfs: any;
  private pinata: PinataSDK | null = null;
  
  constructor() {
    this.ipfs = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https'
    });
    
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      this.pinata = new PinataSDK(
        process.env.PINATA_API_KEY,
        process.env.PINATA_SECRET_KEY
      );
    }
  }
  
  async storeProof(proof: any, metadata: any = {}): Promise<StorageResult> {
    const data = {
      proof,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
    
    const result = await this.ipfs.add(JSON.stringify(data, null, 2));
    const cid = result.cid.toString();
    
    // Pin to Pinata if available
    if (this.pinata) {
      await this.pinata.pinByHash(cid, {
        pinataMetadata: {
          name: `sigil-proof-${Date.now()}`,
          keyvalues: metadata
        }
      });
    }
    
    return {
      cid,
      gateways: {
        ipfs: `https://ipfs.io/ipfs/${cid}`,
        pinata: `https://gateway.pinata.cloud/ipfs/${cid}`,
        cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`
      }
    };
  }
  
  async retrieveProof(cid: string): Promise<any> {
    const chunks = [];
    for await (const chunk of this.ipfs.cat(cid)) {
      chunks.push(chunk);
    }
    
    const data = Buffer.concat(chunks);
    return JSON.parse(data.toString());
  }
}

export const ipfsClient = new SigilIPFSClient();
