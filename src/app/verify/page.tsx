'use client';

import { Header } from "@/components/ui/header"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft,
  Shield, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  FileText,
  Loader2,
  Eye,
  ExternalLink,
  Clock,
  User,
  Github,
  Zap,
  Info
} from 'lucide-react';
import Link from 'next/link';

interface VerificationResult {
  isValid: boolean;
  metadata?: {
    repository: string;
    timestamp: string;
    privacyLevel: string;
  };
  details?: {
    proofType: string;
    circuitHash: string;
    publicSignals: string[];
    contributor: string;
  };
  error?: string;
}

export default function ProofVerification() {
  const [proofInput, setProofInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [inputMethod, setInputMethod] = useState<'paste' | 'upload'>('paste');

  const verifyProof = async () => {
    if (!proofInput.trim()) return;

    try {
      setVerifying(true);
      setResult(null);

      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock verification logic
      let parsedProof;
      try {
        parsedProof = JSON.parse(proofInput);
      } catch {
        setResult({
          isValid: false,
          error: 'Invalid JSON format'
        });
        return;
      }

      // Simulate verification based on proof content
      if (parsedProof.proof && parsedProof.proof.startsWith('zk_proof_')) {
        setResult({
          isValid: true,
          metadata: parsedProof.metadata || {
            repository: 'user/sample-repo',
            timestamp: new Date().toISOString(),
            privacyLevel: 'balanced'
          },
          details: {
            proofType: 'GitHub Contribution Proof',
            circuitHash: '0x' + Math.random().toString(16).substring(2, 18),
            publicSignals: parsedProof.publicSignals || ['signal1', 'signal2'],
            contributor: 'developer@example.com'
          }
        });
      } else {
        setResult({
          isValid: false,
          error: 'Invalid proof format or structure'
        });
      }
    } catch (error) {
      setResult({
        isValid: false,
        error: 'Verification failed: ' + (error as Error).message
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setProofInput(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild className="text-gray-400 hover:text-white">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Verify Zero-Knowledge Proof</h1>
            <p className="text-gray-400 text-lg">
              Verify the authenticity of developer credentials and contributions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Input Proof
                </h2>

                <div className="flex gap-2 mb-4">
                  <Button
                    variant={inputMethod === 'paste' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMethod('paste')}
                    className={inputMethod === 'paste' 
                      ? 'bg-purple-500 text-white' 
                      : 'border-white/20 text-white hover:bg-white/10'
                    }
                  >
                    Paste JSON
                  </Button>
                  <Button
                    variant={inputMethod === 'upload' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMethod('upload')}
                    className={inputMethod === 'upload' 
                      ? 'bg-purple-500 text-white' 
                      : 'border-white/20 text-white hover:bg-white/10'
                    }
                  >
                    Upload File
                  </Button>
                </div>

                {inputMethod === 'paste' ? (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Paste your zero-knowledge proof JSON here..."
                      value={proofInput}
                      onChange={(e) => setProofInput(e.target.value)}
                      className="bg-black/50 border-white/10 text-white font-mono text-sm h-48 resize-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">Drop your proof file here or click to upload</p>
                      <Input
                        type="file"
                        accept=".json,.txt"
                        onChange={handleFileUpload}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    {proofInput && (
                      <div className="bg-black/50 border border-white/10 rounded-xl p-4">
                        <p className="text-gray-400 text-sm mb-2">Loaded proof content:</p>
                        <pre className="text-white font-mono text-xs overflow-auto max-h-32">
                          {proofInput.substring(0, 200)}...
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={verifyProof}
                  disabled={!proofInput.trim() || verifying}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 disabled:opacity-50"
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

              {/* Sample Proof */}
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Try with Sample Proof
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProofInput(`{
  "proof": "zk_proof_1704067200000",
  "publicSignals": ["signal1", "signal2"],
  "metadata": {
    "repository": "user/sample-repo",
    "timestamp": "${new Date().toISOString()}",
    "privacyLevel": "balanced"
  }
}`)}
                  className="text-purple-400 hover:text-purple-300 text-xs"
                >
                  Load Sample Proof
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {!result && !verifying && (
                <div className="glass-card p-8 rounded-2xl text-center">
                  <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Ready to Verify</h3>
                  <p className="text-gray-400 text-sm">
                    Paste or upload a zero-knowledge proof to verify its authenticity
                  </p>
                </div>
              )}

              {verifying && (
                <div className="glass-card p-8 rounded-2xl text-center">
                  <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">Verifying Proof</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Checking cryptographic signatures and validating proof...
                  </p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>• Parsing proof structure...</p>
                    <p>• Validating circuit constraints...</p>
                    <p>• Verifying zero-knowledge proof...</p>
                    <p>• Checking public signals...</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="glass-card p-6 rounded-2xl">
                  <div className="text-center mb-6">
                    {result.isValid ? (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Proof Valid ✓</h3>
                        <p className="text-gray-400">
                          The cryptographic proof has been successfully verified
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Proof Invalid ✗</h3>
                        <p className="text-gray-400">
                          {result.error || 'The proof could not be verified'}
                        </p>
                      </>
                    )}
                  </div>

                  {result.isValid && result.metadata && result.details && (
                    <div className="space-y-4">
                      <div className="border border-white/10 rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3">Proof Metadata</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-400">Repository:</span>
                            <p className="text-white font-mono">{result.metadata.repository}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Privacy Level:</span>
                            <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 ml-2">
                              {result.metadata.privacyLevel}
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400">Generated:</span>
                            <p className="text-white">{new Date(result.metadata.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border border-white/10 rounded-xl p-4">
                        <h4 className="font-semibold text-white mb-3">Verification Details</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Proof Type:</span>
                            <span className="text-white">{result.details.proofType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Circuit Hash:</span>
                            <span className="text-white font-mono text-xs">{result.details.circuitHash}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Public Signals:</span>
                            <span className="text-white">{result.details.publicSignals.length} signals</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10 flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10 flex-1"
                          asChild
                        >
                          <Link href={`/github/${result.metadata.repository}`}>
                            <Github className="w-4 h-4 mr-2" />
                            View Repository
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setResult(null);
                        setProofInput('');
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      Verify Another Proof
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              How Verification Works
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Parse Proof</h4>
                <p className="text-gray-400">
                  The proof JSON is parsed and validated for correct structure and format.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Verify Cryptography</h4>
                <p className="text-gray-400">
                  Zero-knowledge proofs are verified against the original circuit constraints.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Validate Claims</h4>
                <p className="text-gray-400">
                  Public signals are checked to ensure the proof matches expected criteria.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 