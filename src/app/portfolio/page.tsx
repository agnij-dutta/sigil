'use client';

import { Header } from "@/components/ui/header"
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  Shield, 
  Star,
  GitBranch,
  Code,
  Calendar,
  ExternalLink,
  Download,
  Share2,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Award,
  CheckCircle,
  Github,
  Globe,
  Copy,
  Eye,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '../../../web3/wallet/hooks/useWallet';

interface Credential {
  id: string;
  type: string;
  title: string;
  description: string;
  repository: string;
  privacyLevel: 'minimal' | 'balanced' | 'maximum';
  verificationStatus: 'verified' | 'pending' | 'invalid';
  issueDate: string;
  expiryDate?: string;
  metrics: {
    commits: number;
    linesOfCode: number;
    languages: string[];
    collaborators: number;
  };
  skills: string[];
  proofHash: string;
}

interface PortfolioStats {
  totalCredentials: number;
  totalCommits: number;
  totalRepositories: number;
  verifiedSkills: string[];
  collaborations: number;
  totalStars: number;
}

export default function Portfolio() {
  const { isAuthenticated, user } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [shareableLink, setShareableLink] = useState('');

  useEffect(() => {
    // Mock data for demonstration
    const mockCredentials: Credential[] = [
      {
        id: '1',
        type: 'repository',
        title: 'Full-Stack Web Application',
        description: 'Developed a comprehensive e-commerce platform with React, Node.js, and PostgreSQL',
        repository: 'user/ecommerce-platform',
        privacyLevel: 'balanced',
        verificationStatus: 'verified',
        issueDate: '2024-01-15',
        metrics: {
          commits: 156,
          linesOfCode: 15420,
          languages: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
          collaborators: 3
        },
        skills: ['Full-Stack Development', 'React', 'Node.js', 'Database Design', 'API Development'],
        proofHash: '0xabcd1234...'
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
        metrics: {
          commits: 89,
          linesOfCode: 8940,
          languages: ['JavaScript', 'Python', 'Go'],
          collaborators: 12
        },
        skills: ['Open Source', 'Community Collaboration', 'Code Review', 'Documentation'],
        proofHash: '0xef567890...'
      },
      {
        id: '3',
        type: 'skill',
        title: 'Blockchain Development',
        description: 'Smart contract development and DeFi protocol implementation',
        repository: 'user/defi-protocol',
        privacyLevel: 'maximum',
        verificationStatus: 'verified',
        issueDate: '2024-03-10',
        metrics: {
          commits: 78,
          linesOfCode: 5680,
          languages: ['Solidity', 'JavaScript', 'Rust'],
          collaborators: 2
        },
        skills: ['Solidity', 'Smart Contracts', 'DeFi', 'Web3', 'Security Auditing'],
        proofHash: '0x12345678...'
      }
    ];

    const mockStats: PortfolioStats = {
      totalCredentials: mockCredentials.length,
      totalCommits: mockCredentials.reduce((sum, cred) => sum + cred.metrics.commits, 0),
      totalRepositories: mockCredentials.length,
      verifiedSkills: Array.from(new Set(mockCredentials.flatMap(cred => cred.skills))),
      collaborations: mockCredentials.reduce((sum, cred) => sum + cred.metrics.collaborators, 0),
      totalStars: 285
    };

    setCredentials(mockCredentials);
    setStats(mockStats);
  }, []);

  const generateShareableLink = () => {
    const link = `${window.location.origin}/portfolio/public/${user?.id || 'demo'}`;
    setShareableLink(link);
    navigator.clipboard.writeText(link);
  };

  const getPrivacyIcon = (level: string) => {
    switch (level) {
      case 'minimal': return <Eye className="w-4 h-4" />;
      case 'balanced': return <Shield className="w-4 h-4" />;
      case 'maximum': return <Lock className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getPrivacyColor = (level: string) => {
    switch (level) {
      case 'minimal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'balanced': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'maximum': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="text-gray-400 hover:text-white">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={generateShareableLink}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Portfolio
            </Button>
            <Button className="bg-gradient-to-r from-purple-500 to-blue-500">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="glass-card p-8 rounded-2xl mb-8">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                  {user?.name?.[0] || 'D'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {user?.name || 'Developer Portfolio'}
                </h1>
                <p className="text-gray-400 mb-4">
                  Verified Developer Credentials • Zero-Knowledge Proofs
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Identity Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-4 h-4 text-purple-400" />
                    Privacy Protected
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-yellow-400" />
                    {stats?.totalCredentials || 0} Credentials
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="glass-card p-4 rounded-xl text-center">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalCredentials}</p>
                <p className="text-xs text-gray-400">Credentials</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalCommits}</p>
                <p className="text-xs text-gray-400">Commits</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Code className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.verifiedSkills.length}</p>
                <p className="text-xs text-gray-400">Skills</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.collaborations}</p>
                <p className="text-xs text-gray-400">Collaborations</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalStars}</p>
                <p className="text-xs text-gray-400">Stars</p>
              </div>
              <div className="glass-card p-4 rounded-xl text-center">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Github className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalRepositories}</p>
                <p className="text-xs text-gray-400">Repositories</p>
              </div>
            </div>
          )}

          {/* Verified Skills */}
          {stats?.verifiedSkills && (
            <div className="glass-card p-6 rounded-2xl mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Verified Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {stats.verifiedSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Credentials */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Verified Credentials
            </h2>
            
            <div className="grid gap-6">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="glass-card p-6 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                  onClick={() => setSelectedCredential(credential)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{credential.title}</h3>
                        <Badge
                          variant="secondary"
                          className="bg-green-500/20 text-green-400 border-green-500/30"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={getPrivacyColor(credential.privacyLevel)}
                        >
                          {getPrivacyIcon(credential.privacyLevel)}
                          <span className="ml-1 capitalize">{credential.privacyLevel}</span>
                        </Badge>
                      </div>
                      <p className="text-gray-400 mb-3">{credential.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Commits:</span>
                          <p className="text-white font-semibold">{credential.metrics.commits}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Lines of Code:</span>
                          <p className="text-white font-semibold">{credential.metrics.linesOfCode.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Languages:</span>
                          <p className="text-white font-semibold">{credential.metrics.languages.length}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Collaborators:</span>
                          <p className="text-white font-semibold">{credential.metrics.collaborators}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        asChild
                      >
                        <Link href={`/verify?proof=${credential.proofHash}`}>
                          <Shield className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {credential.skills.slice(0, 5).map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-500/20 text-gray-300 text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {credential.skills.length > 5 && (
                      <Badge variant="secondary" className="bg-gray-500/20 text-gray-300 text-xs">
                        +{credential.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Issued: {new Date(credential.issueDate).toLocaleDateString()}</span>
                    <span className="font-mono">{credential.proofHash.substring(0, 12)}...</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 