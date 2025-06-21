'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/ui/header';
import { WalletStatus } from '@/components/ui/wallet-status';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// Badge import removed as unused
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';
import ContractService, { CONTRACTS } from '@/lib/contracts';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Copy,
  AlertTriangle,
  Info,
  Zap,
  ArrowRight,
  Eye,
  Link as LinkIcon,
  Upload
} from 'lucide-react';

interface VerificationResult {
  isValid: boolean;
  credentialHash?: string;
  verifierType?: string;
  transactionHash?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export default function VerifyPage() {
  const { 
    isAuthenticated, 
    hasWallet, 
    credentials, 
    loadingCredentials,
    registerCredential
  } = useWallet();

  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [credentialHash, setCredentialHash] = useState('');
  const [proof, setProof] = useState('');
  const [publicSignals, setPublicSignals] = useState('');
  const [verifierType, setVerifierType] = useState<keyof typeof CONTRACTS>('AGGREGATE_VERIFIER');
  const [activeTab, setActiveTab] = useState<'verify' | 'register' | 'view'>('verify');

  // Demo data for testing
  const demoCredentialHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const demoProof = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const demoPublicSignals = '[1, 2, 3, 4, 5]';

  useEffect(() => {
    // Pre-fill demo data for easier testing - only run once on mount
    if (!credentialHash) {
      setCredentialHash(demoCredentialHash);
    }
    if (!proof) {
      setProof(demoProof);
    }
    if (!publicSignals) {
      setPublicSignals(demoPublicSignals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyCredential = async () => {
    if (!credentialHash.trim()) {
      alert('Please enter a credential hash');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const isValid = await ContractService.verifyCredential(credentialHash);
      
      setVerificationResult({
        isValid,
        credentialHash,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        isValid: false,
        credentialHash,
        timestamp: Date.now()
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proof.trim() || !publicSignals.trim()) {
      alert('Please enter both proof and public signals, or upload a proof JSON file');
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      // Parse public signals
      let signals: bigint[];
      try {
        const parsedSignals = JSON.parse(publicSignals);
        signals = Array.isArray(parsedSignals) 
          ? parsedSignals.map((s: string | number) => BigInt(s))
          : [BigInt(parsedSignals)];
      } catch {
        // If it's not JSON, try to parse as comma-separated values
        signals = publicSignals.split(',').map(s => BigInt(s.trim()));
      }
      
      const isValid = await ContractService.verifyProof(
        verifierType,
        proof,
        signals
      );
      
      setVerificationResult({
        isValid,
        verifierType,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Proof verification failed:', error);
      setVerificationResult({
        isValid: false,
        verifierType,
        timestamp: Date.now()
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle JSON file upload
  const handleProofFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const proofData = JSON.parse(content);
        
        console.log('Uploaded proof data:', proofData);
        
        // Handle different proof formats
        if (proofData.proof && proofData.proof.proofValue && proofData.proof.credentialType) {
          // Full Verifiable Credential format
          console.log('Detected Verifiable Credential format');
          
          // Extract the ZK proof from the credential
          const zkProof = proofData.proof.proofValue;
          const publicSignals = proofData.proof.publicSignals;
          const credentialType = proofData.proof.credentialType;
          
          // Convert Groth16 proof to bytes format for contract verification
          const encodedProof = encodeGroth16Proof(zkProof);
          
          setProof(encodedProof);
          setPublicSignals(JSON.stringify(publicSignals));
          
          // Set the appropriate verifier type based on credential type
          const verifierMapping: Record<string, keyof typeof CONTRACTS> = {
            'repository': 'REPOSITORY_VERIFIER',
            'language': 'LANGUAGE_VERIFIER', 
            'collaboration': 'COLLABORATION_VERIFIER',
            'aggregate': 'AGGREGATE_VERIFIER'
          };
          
          const mappedVerifier = verifierMapping[credentialType];
          if (mappedVerifier) {
            setVerifierType(mappedVerifier);
          }
          
          alert(`Verifiable Credential loaded successfully! Type: ${credentialType}, Repository: ${proofData.credentialSubject?.repository || 'Unknown'}`);
          
        } else if (proofData.rawProof && proofData.rawProof.proof && proofData.rawProof.publicSignals) {
          // Raw proof format from the credential
          console.log('Detected raw proof format from credential');
          
          const zkProof = proofData.rawProof.proof;
          const publicSignals = proofData.rawProof.publicSignals;
          const credentialType = proofData.rawProof.credentialType;
          
          // Convert Groth16 proof to bytes format for contract verification
          const encodedProof = encodeGroth16Proof(zkProof);
          
          setProof(encodedProof);
          setPublicSignals(JSON.stringify(publicSignals));
          
          // Set the appropriate verifier type based on credential type
          const verifierMapping: Record<string, keyof typeof CONTRACTS> = {
            'repository': 'REPOSITORY_VERIFIER',
            'language': 'LANGUAGE_VERIFIER', 
            'collaboration': 'COLLABORATION_VERIFIER',
            'aggregate': 'AGGREGATE_VERIFIER'
          };
          
          const mappedVerifier = verifierMapping[credentialType];
          if (mappedVerifier) {
            setVerifierType(mappedVerifier);
          }
          
          alert(`Raw proof loaded successfully! Type: ${credentialType}`);
          
        } else if (proofData.proof && proofData.publicSignals && proofData.credentialType) {
          // Simple ZKProofData format
          console.log('Detected simple ZKProofData format');
          
          // Convert Groth16 proof to bytes format for contract verification
          const groth16Proof = proofData.proof;
          const encodedProof = encodeGroth16Proof(groth16Proof);
          
          setProof(encodedProof);
          setPublicSignals(JSON.stringify(proofData.publicSignals));
          
          // Set the appropriate verifier type based on credential type
          const verifierMapping: Record<string, keyof typeof CONTRACTS> = {
            'repository': 'REPOSITORY_VERIFIER',
            'language': 'LANGUAGE_VERIFIER', 
            'collaboration': 'COLLABORATION_VERIFIER',
            'aggregate': 'AGGREGATE_VERIFIER'
          };
          
          const mappedVerifier = verifierMapping[proofData.credentialType];
          if (mappedVerifier) {
            setVerifierType(mappedVerifier);
          }
          
          alert(`Simple proof loaded successfully! Credential Type: ${proofData.credentialType}`);
          
        } else if (proofData.proof && proofData.publicSignals) {
          // Standard snarkjs format
          console.log('Detected snarkjs format');
          setProof(JSON.stringify(proofData.proof));
          setPublicSignals(JSON.stringify(proofData.publicSignals));
          alert('Snarkjs proof loaded successfully!');
          
        } else if (proofData.pi_a && proofData.pi_b && proofData.pi_c) {
          // Raw Groth16 format
          console.log('Detected raw Groth16 format');
          const formattedProof = {
            a: proofData.pi_a.slice(0, 2),
            b: [proofData.pi_b[0].slice(0, 2), proofData.pi_b[1].slice(0, 2)],
            c: proofData.pi_c.slice(0, 2)
          };
          setProof(JSON.stringify(formattedProof));
          setPublicSignals(JSON.stringify(proofData.publicSignals || []));
          alert('Groth16 proof loaded successfully!');
          
        } else if (proofData.encodedProof && proofData.publicSignals) {
          // Pre-encoded format
          console.log('Detected pre-encoded format');
          setProof(proofData.encodedProof);
          setPublicSignals(JSON.stringify(proofData.publicSignals));
          alert('Encoded proof loaded successfully!');
          
        } else {
          console.error('Unsupported proof format:', Object.keys(proofData));
          alert('Unsupported proof format. Expected Sigil proof format with: proof, publicSignals, credentialType');
          return;
        }
        
      } catch (error) {
        console.error('Failed to parse proof file:', error);
        alert('Invalid JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Helper function to encode Groth16 proof to bytes format for contract verification
  const encodeGroth16Proof = (groth16Proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  }): string => {
    try {
      // Convert Groth16 proof components to a single bytes string
      // This is a simplified encoding - in production, use proper encoding
      const a1 = groth16Proof.a[0];
      const a2 = groth16Proof.a[1];
      const b1 = groth16Proof.b[0][0];
      const b2 = groth16Proof.b[0][1];
      const b3 = groth16Proof.b[1][0];
      const b4 = groth16Proof.b[1][1];
      const c1 = groth16Proof.c[0];
      const c2 = groth16Proof.c[1];
      
      // Concatenate all components (remove 0x prefixes except the first)
      const encoded = a1 + a2.slice(2) + b1.slice(2) + b2.slice(2) + b3.slice(2) + b4.slice(2) + c1.slice(2) + c2.slice(2);
      
      return encoded;
    } catch (error) {
      console.error('Failed to encode Groth16 proof:', error);
      return JSON.stringify(groth16Proof);
    }
  };

  const handleRegisterCredential = async () => {
    if (!hasWallet) {
      alert('Please connect your wallet first');
      return;
    }

    setRegistering(true);

    try {
      const metadata = JSON.stringify({
        type: 'demo_credential',
        timestamp: Date.now(),
        description: 'Demo credential registered via UI',
        network: 'sepolia'
      });

      const result = await registerCredential(
        'demo',
        demoCredentialHash,
        metadata
      );

      if (result.success) {
        alert(`Credential registered successfully! Transaction: ${result.hash}`);
      } else {
        alert(`Registration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  // Function to open Sepolia scan - can be used for viewing transactions
  // const openSepoliaScan = (hash: string) => {
  //   window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank');
  // };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Credential Verification</h1>
            <p className="text-gray-400 text-lg">
              Verify and manage your on-chain credentials using deployed Sepolia contracts
            </p>
          </div>

          {/* Network Status */}
          <div className="glass-card p-4 rounded-xl mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-white font-medium">Connected to Sepolia Testnet</h3>
                  <p className="text-gray-400 text-sm">Chain ID: 11155111 • {Object.keys(CONTRACTS).length} contracts deployed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm">Live</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Tab Navigation */}
              <div className="glass-card p-1 rounded-xl">
                <div className="flex bg-black/30 rounded-lg">
                  <button
                    onClick={() => setActiveTab('verify')}
                    className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                      activeTab === 'verify' 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-2" />
                    Verify Credential
                  </button>
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                      activeTab === 'register' 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4 inline mr-2" />
                    Register Credential
                  </button>
                  <button
                    onClick={() => setActiveTab('view')}
                    className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                      activeTab === 'view' 
                        ? 'bg-purple-500 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4 inline mr-2" />
                    View Credentials
                  </button>
                </div>
              </div>

              {/* Verify Tab */}
              {activeTab === 'verify' && (
                <div className="space-y-6">
                  <Card className="p-6 bg-black/40 border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-4">Verify Credential Hash</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="credentialHash" className="text-gray-300">Credential Hash</Label>
                        <div className="flex gap-2">
                          <Input
                            id="credentialHash"
                            value={credentialHash}
                            onChange={(e) => setCredentialHash(e.target.value)}
                            placeholder="0x..."
                            className="bg-black/30 border-white/20 text-white"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(credentialHash)}
                            className="px-3"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={handleVerifyCredential}
                        disabled={verifying || !credentialHash.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Verify Credential
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6 bg-black/40 border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-4">Verify ZK Proof</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="verifierType" className="text-gray-300">Verifier Contract</Label>
                        <select
                          id="verifierType"
                          value={verifierType}
                          onChange={(e) => setVerifierType(e.target.value as keyof typeof CONTRACTS)}
                          className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white"
                        >
                          <option value="AGGREGATE_VERIFIER">Aggregate Verifier</option>
                          <option value="COLLABORATION_VERIFIER">Collaboration Verifier</option>
                          <option value="LANGUAGE_VERIFIER">Language Verifier</option>
                          <option value="REPOSITORY_VERIFIER">Repository Verifier</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="proof" className="text-gray-300">Proof (hex)</Label>
                        <Input
                          id="proof"
                          value={proof}
                          onChange={(e) => setProof(e.target.value)}
                          placeholder="0x..."
                          className="bg-black/30 border-white/20 text-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="publicSignals" className="text-gray-300">Public Signals (JSON array)</Label>
                        <Textarea
                          id="publicSignals"
                          value={publicSignals}
                          onChange={(e) => setPublicSignals(e.target.value)}
                          placeholder="[1, 2, 3, 4, 5]"
                          className="bg-black/30 border-white/20 text-white"
                          rows={3}
                        />
                      </div>

                      {/* File Upload Section */}
                      <div className="border-t border-white/10 pt-4">
                        <Label className="text-gray-300 mb-2 block">Or Upload Proof JSON File</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleProofFileUpload}
                            className="hidden"
                            id="proof-file-upload"
                          />
                          <label
                            htmlFor="proof-file-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg cursor-pointer transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Choose JSON File
                          </label>
                          <span className="text-gray-400 text-sm">
                            Supports snarkjs, Groth16, and Sigil proof formats
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleVerifyProof}
                        disabled={verifying || !proof.trim() || !publicSignals.trim()}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {verifying ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Verify Proof
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* Register Tab */}
              {activeTab === 'register' && (
                <Card className="p-6 bg-black/40 border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Register New Credential</h3>
                  
                  {!isAuthenticated ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-400">Please connect your wallet to register credentials</p>
                    </div>
                  ) : !hasWallet ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-400">Please create a wallet to register credentials</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400 font-medium">Demo Registration</span>
                        </div>
                        <p className="text-gray-300 text-sm">
                          This will register a demo credential on the Sepolia testnet. 
                          The transaction will be visible on Etherscan.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-gray-300">Credential Type</Label>
                          <Input value="demo" disabled className="bg-black/30 border-white/20 text-white" />
                        </div>
                        <div>
                          <Label className="text-gray-300">Credential Hash</Label>
                          <Input value={demoCredentialHash} disabled className="bg-black/30 border-white/20 text-white font-mono text-xs" />
                        </div>
                        <div>
                          <Label className="text-gray-300">Registry Contract</Label>
                          <Input value={CONTRACTS.CREDENTIAL_REGISTRY} disabled className="bg-black/30 border-white/20 text-white font-mono text-xs" />
                        </div>
                      </div>

                      <Button
                        onClick={handleRegisterCredential}
                        disabled={registering}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {registering ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Register Demo Credential
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* View Tab */}
              {activeTab === 'view' && (
                <Card className="p-6 bg-black/40 border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Your Credentials</h3>
                  
                  {!isAuthenticated ? (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">Connect your wallet to view credentials</p>
                    </div>
                  ) : loadingCredentials ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 text-purple-500 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-400">Loading credentials...</p>
                    </div>
                  ) : credentials.length > 0 ? (
                    <div className="space-y-3">
                      {credentials.map((credential, index) => (
                        <div key={index} className="bg-black/30 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-green-400" />
                              <div>
                                <p className="text-white font-mono text-sm">{credential}</p>
                                <p className="text-gray-400 text-xs">Registered on Sepolia</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(credential)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCredentialHash(credential)}
                              >
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No credentials found</p>
                      <p className="text-gray-500 text-sm mt-2">Register your first credential to get started</p>
                    </div>
                  )}
                </Card>
              )}

              {/* Verification Result */}
              {verificationResult && (
                <Card className="p-6 bg-black/40 border-white/10">
                  <h3 className="text-xl font-semibold text-white mb-4">Verification Result</h3>
                  
                  <div className={`flex items-center gap-3 p-4 rounded-lg ${
                    verificationResult.isValid 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}>
                    {verificationResult.isValid ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <p className={`font-medium ${
                        verificationResult.isValid ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {verificationResult.verifierType 
                          ? `Verified using ${verificationResult.verifierType.replace('_', ' ').toLowerCase()}`
                          : `Credential ${verificationResult.isValid ? 'exists' : 'not found'} in registry`
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Wallet Status */}
              <Card className="p-4 bg-black/40 border-white/10">
                <h4 className="text-white font-medium mb-3">Wallet Status</h4>
                <WalletStatus 
                  showBalance={true} 
                  showActions={true} 
                  showCredentials={true}
                />
              </Card>

              {/* Deployed Contracts */}
              <Card className="p-4 bg-black/40 border-white/10">
                <h4 className="text-white font-medium mb-3">Deployed Contracts</h4>
                <div className="space-y-3">
                  {Object.entries(CONTRACTS).map(([name, address]) => (
                    <div key={name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">{name.replace('_', ' ')}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-gray-500 text-xs font-mono break-all">{address}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Network Info */}
              <Card className="p-4 bg-black/40 border-white/10">
                <h4 className="text-white font-medium mb-3">Network Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Network</span>
                    <span className="text-white text-sm">Sepolia Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Chain ID</span>
                    <span className="text-white text-sm">11155111</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Explorer</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open('https://sepolia.etherscan.io', '_blank')}
                      className="h-5 p-0 text-purple-400 hover:text-purple-300"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Etherscan
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 