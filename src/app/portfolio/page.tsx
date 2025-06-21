'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from "@/components/ui/header";
import { 
  Shield, 
  Download, 
  Share2, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Github,
  ArrowLeft,
  Star,
  GitBranch,
  Code2,
  Award
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';

interface VerifiableCredential {
  id: string;
  type: 'repository' | 'collaboration' | 'language' | 'contribution';
  title: string;
  description: string;
  repository: string;
  privacyLevel: 'minimal' | 'balanced' | 'maximum';
  verificationStatus: 'verified' | 'pending' | 'invalid';
  issueDate: string;
  expiryDate?: string;
  metadata: {
    commits: number;
    languages: string[];
    collaborators: number;
    stars: number;
    skills: string[];
    proofHash: string;
  };
}

const mockCredentials: VerifiableCredential[] = [
  {
    id: '1',
    type: 'repository',
    title: 'Full-Stack Web Application',
    description: 'Developed a comprehensive e-commerce platform with React, Node.js, and PostgreSQL',
    repository: 'user/ecommerce-platform',
    privacyLevel: 'balanced',
    verificationStatus: 'verified',
    issueDate: '2024-01-15',
    expiryDate: '2025-01-15',
    metadata: {
      commits: 156,
      languages: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      collaborators: 3,
      stars: 24,
      skills: ['Full-Stack Development', 'React', 'Node.js', 'Database Design', 'API Development'],
      proofHash: '0xabcd1234...'
    }
  },
  {
    id: '2',
    type: 'collaboration',
    title: 'Open Source Contribution',
    description: 'Significant contributions to popular open-source libraries and frameworks',
    repository: 'opensource/popular-library',
    privacyLevel: 'minimal',
    verificationStatus: 'verified',
    issueDate: '2024-02-20',
    expiryDate: '2025-02-20',
    metadata: {
      commits: 89,
      languages: ['JavaScript', 'Python', 'Go'],
      collaborators: 15,
      stars: 342,
      skills: ['Open Source', 'Community Collaboration', 'Code Review', 'Documentation'],
      proofHash: '0xef567890...'
    }
  },
  {
    id: '3',
    type: 'language',
    title: 'TypeScript Expertise',
    description: 'Advanced TypeScript development across multiple large-scale projects',
    repository: 'user/typescript-projects',
    privacyLevel: 'maximum',
    verificationStatus: 'verified',
    issueDate: '2024-03-10',
    metadata: {
      commits: 284,
      languages: ['TypeScript', 'JavaScript'],
      collaborators: 5,
      stars: 67,
      skills: ['TypeScript', 'Type Safety', 'Advanced Patterns', 'Library Development'],
      proofHash: '0x12345678...'
    }
  }
];

export default function PortfolioPage() {
  const { user, isAuthenticated } = useWallet();
  
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setCredentials(mockCredentials);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: VerifiableCredential['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'invalid':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPrivacyColor = (level: VerifiableCredential['privacyLevel']) => {
    switch (level) {
      case 'minimal':
        return 'bg-blue-500/20 text-blue-400';
      case 'balanced':
        return 'bg-purple-500/20 text-purple-400';
      case 'maximum':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTypeIcon = (type: VerifiableCredential['type']) => {
    switch (type) {
      case 'repository':
        return <Github className="w-4 h-4" />;
      case 'collaboration':
        return <GitBranch className="w-4 h-4" />;
      case 'language':
        return <Code2 className="w-4 h-4" />;
      case 'contribution':
        return <Star className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const downloadCredential = (credential: VerifiableCredential) => {
    const credentialData = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'GitHubCredential'],
      credentialSubject: {
        id: user?.id || 'did:example:user',
        achievement: credential
      },
      issuer: 'did:web:sigil.dev',
      issuanceDate: credential.issueDate,
      expirationDate: credential.expiryDate,
      proof: {
        type: 'ZKProof',
        proofHash: credential.metadata.proofHash,
        verificationMethod: 'https://sigil.dev/keys/verification'
      }
    };

    const blob = new Blob([JSON.stringify(credentialData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${credential.title.replace(/\s+/g, '-').toLowerCase()}-credential.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your portfolio...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Developer Portfolio
              </h1>
              <p className="text-gray-400">
                Your verifiable development credentials and achievements
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Credentials</p>
                <p className="text-2xl font-bold text-white">{credentials.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Verified</p>
                <p className="text-2xl font-bold text-white">
                  {credentials.filter(c => c.verificationStatus === 'verified').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Commits</p>
                <p className="text-2xl font-bold text-white">
                  {credentials.reduce((acc, c) => acc + c.metadata.commits, 0)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Languages</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(credentials.flatMap(c => c.metadata.languages)).size}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Code2 className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        {!isAuthenticated ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Connect Your Identity</h3>
            <p className="text-gray-400 mb-6">Sign in to view your verifiable development portfolio</p>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" asChild>
              <Link href="/dashboard">
                Get Started
              </Link>
            </Button>
          </div>
        ) : credentials.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center">
            <Zap className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Credentials Yet</h3>
            <p className="text-gray-400 mb-6">Generate your first verifiable credential from your development work</p>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" asChild>
              <Link href="/proof/generate">
                <Zap className="w-4 h-4 mr-2" />
                Generate Credential
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {credentials.map((credential) => (
              <div key={credential.id} className="glass-card p-6 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      {getTypeIcon(credential.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{credential.title}</h3>
                      <p className="text-purple-400 text-sm font-mono">{credential.repository}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className={getStatusColor(credential.verificationStatus)}>
                      {credential.verificationStatus === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {credential.verificationStatus === 'pending' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {credential.verificationStatus}
                    </Badge>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {credential.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <p className="text-lg font-bold text-white">{credential.metadata.commits}</p>
                    <p className="text-xs text-gray-400">Commits</p>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-lg">
                    <p className="text-lg font-bold text-white">{credential.metadata.stars}</p>
                    <p className="text-xs text-gray-400">Stars</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-300">Technologies</p>
                    <Badge variant="secondary" className={getPrivacyColor(credential.privacyLevel)}>
                      {credential.privacyLevel} privacy
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {credential.metadata.languages.slice(0, 3).map((lang) => (
                      <Badge key={lang} variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                        {lang}
                      </Badge>
                    ))}
                    {credential.metadata.languages.length > 3 && (
                      <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 text-xs">
                        +{credential.metadata.languages.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">Skills Demonstrated</p>
                  <div className="flex flex-wrap gap-2">
                    {credential.metadata.skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {credential.metadata.skills.length > 4 && (
                      <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 text-xs">
                        +{credential.metadata.skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="text-xs text-gray-500">
                    <p>Issued: {new Date(credential.issueDate).toLocaleDateString()}</p>
                    {credential.expiryDate && (
                      <p>Expires: {new Date(credential.expiryDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                      onClick={() => downloadCredential(credential)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {isAuthenticated && credentials.length > 0 && (
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/proof/generate">
                  <Zap className="w-4 h-4 mr-2" />
                  Generate New Credential
                </Link>
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" asChild>
                <Link href="/verify">
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Credential
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 