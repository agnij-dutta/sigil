import { create, IPFS } from 'ipfs-core';
import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { CID } from 'multiformats/cid';
import { Buffer } from 'buffer';
import { encrypt, decrypt } from '../encryption/crypto';

export interface IPFSStorageOptions {
    enableEncryption?: boolean;
    redundancyFactor?: number;
    pinningServices?: string[];
    timeout?: number;
}

export class IPFSClient {
    private helia: any;
    private fs: any;
    private options: IPFSStorageOptions;
    private pinningClients: Map<string, any> = new Map();

    constructor(options: IPFSStorageOptions = {}) {
        this.options = {
            enableEncryption: true,
            redundancyFactor: 3,
            pinningServices: ['pinata', 'infura', 'filebase'],
            timeout: 30000,
            ...options
        };
    }

    /**
     * Initialize IPFS client and pinning services
     */
    public async initialize(): Promise<void> {
        try {
            this.helia = await createHelia();
            this.fs = unixfs(this.helia);
            
            // Initialize pinning service clients
            await this.initializePinningServices();
            
            console.log('IPFS client initialized successfully');
        } catch (error) {
            console.error('Failed to initialize IPFS client:', error);
            throw error;
        }
    }

    /**
     * Store data on IPFS with optional encryption and redundancy
     */
    public async storeData(data: any, metadata?: any): Promise<{
        cid: string;
        encryptionKey?: string;
        pinned: boolean;
        redundantCopies: number;
    }> {
        try {
            let processedData = data;
            let encryptionKey: string | undefined;

            // Encrypt data if enabled
            if (this.options.enableEncryption) {
                const encrypted = await encrypt(JSON.stringify(data));
                processedData = encrypted.data;
                encryptionKey = encrypted.key;
            }

            // Add to IPFS
            const buffer = Buffer.from(JSON.stringify({
                data: processedData,
                metadata,
                timestamp: Date.now(),
                encrypted: this.options.enableEncryption
            }));

            const cid = await this.fs.addBytes(buffer);
            
            // Pin to multiple services for redundancy
            const pinningResults = await this.pinToServices(cid.toString());
            
            return {
                cid: cid.toString(),
                encryptionKey,
                pinned: pinningResults.length > 0,
                redundantCopies: pinningResults.length
            };
        } catch (error) {
            console.error('Failed to store data on IPFS:', error);
            throw error;
        }
    }

    /**
     * Retrieve data from IPFS with decryption
     */
    public async retrieveData(cid: string, encryptionKey?: string): Promise<any> {
        try {
            const cidObj = CID.parse(cid);
            const bytes = await this.fs.cat(cidObj);
            
            let buffer = Buffer.alloc(0);
            for await (const chunk of bytes) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            const storedData = JSON.parse(buffer.toString());
            
            // Decrypt if necessary
            if (storedData.encrypted && encryptionKey) {
                const decrypted = await decrypt(storedData.data, encryptionKey);
                return JSON.parse(decrypted);
            }
            
            return storedData.data;
        } catch (error) {
            console.error('Failed to retrieve data from IPFS:', error);
            throw error;
        }
    }

    /**
     * Store ZK proof with metadata
     */
    public async storeProof(proof: any, publicSignals: any[], metadata: any): Promise<{
        cid: string;
        encryptionKey?: string;
        pinned: boolean;
    }> {
        const proofData = {
            proof,
            publicSignals,
            metadata: {
                ...metadata,
                proofType: metadata.proofType || 'zk-snark',
                version: metadata.version || '1.0.0',
                timestamp: Date.now()
            }
        };

        const result = await this.storeData(proofData);
        return {
            cid: result.cid,
            encryptionKey: result.encryptionKey,
            pinned: result.pinned
        };
    }

    /**
     * Store credential with expiration
     */
    public async storeCredential(credential: any, expirationDays: number = 365): Promise<{
        cid: string;
        encryptionKey?: string;
        expiresAt: number;
    }> {
        const expiresAt = Date.now() + (expirationDays * 24 * 60 * 60 * 1000);
        
        const credentialData = {
            ...credential,
            expiresAt,
            stored: Date.now()
        };

        const result = await this.storeData(credentialData);
        return {
            cid: result.cid,
            encryptionKey: result.encryptionKey,
            expiresAt
        };
    }

    /**
     * Pin content to multiple pinning services
     */
    private async pinToServices(cid: string): Promise<string[]> {
        const results: string[] = [];
        
        for (const [serviceName, client] of this.pinningClients) {
            try {
                await client.pin(cid);
                results.push(serviceName);
                console.log(`Successfully pinned ${cid} to ${serviceName}`);
            } catch (error) {
                console.error(`Failed to pin ${cid} to ${serviceName}:`, error);
            }
        }
        
        return results;
    }

    /**
     * Initialize pinning service clients
     */
    private async initializePinningServices(): Promise<void> {
        // This would typically initialize actual pinning service clients
        // For now, we'll create mock clients for demonstration
        
        if (this.options.pinningServices?.includes('pinata')) {
            this.pinningClients.set('pinata', {
                pin: async (cid: string) => {
                    // Mock Pinata client
                    console.log(`Mock pinning ${cid} to Pinata`);
                    return { success: true };
                }
            });
        }

        if (this.options.pinningServices?.includes('infura')) {
            this.pinningClients.set('infura', {
                pin: async (cid: string) => {
                    // Mock Infura client
                    console.log(`Mock pinning ${cid} to Infura`);
                    return { success: true };
                }
            });
        }

        if (this.options.pinningServices?.includes('filebase')) {
            this.pinningClients.set('filebase', {
                pin: async (cid: string) => {
                    // Mock Filebase client
                    console.log(`Mock pinning ${cid} to Filebase`);
                    return { success: true };
                }
            });
        }
    }

    /**
     * Get content statistics
     */
    public async getContentStats(cid: string): Promise<{
        size: number;
        pinned: boolean;
        availability: number;
        replicas: string[];
    }> {
        try {
            const cidObj = CID.parse(cid);
            
            // Check availability across pinning services
            const replicas: string[] = [];
            for (const [serviceName] of this.pinningClients) {
                try {
                    // Mock availability check
                    replicas.push(serviceName);
                } catch (error) {
                    console.warn(`${serviceName} unavailable for ${cid}`);
                }
            }

            return {
                size: 0, // Would get actual size
                pinned: replicas.length > 0,
                availability: replicas.length / this.pinningClients.size,
                replicas
            };
        } catch (error) {
            console.error('Failed to get content stats:', error);
            throw error;
        }
    }

    /**
     * Clean up expired content
     */
    public async cleanupExpiredContent(): Promise<{
        cleaned: number;
        errors: number;
    }> {
        let cleaned = 0;
        let errors = 0;
        
        // This would implement garbage collection logic
        // For now, return mock stats
        
        return { cleaned, errors };
    }

    /**
     * Close IPFS client
     */
    public async close(): Promise<void> {
        if (this.helia) {
            await this.helia.stop();
        }
    }
} 