"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Eye, ExternalLink, GitBranch, Star, Code, Clock, Users, MoreVertical, Zap } from "lucide-react";
import Link from "next/link";

type Contributor = {
  name: string;
  email: string;
  avatar: string;
  role: string;
};

type Project = {
  id: string;
  title: string;
  repo: string;
  status: "Active" | "Inactive" | "In Progress";
  team: string;
  tech: string;
  createdAt: string;
  contributors: Contributor[];
  stars?: number;
  commits?: number;
  lastUpdated?: string;
  description?: string;
  owner?: string;
  repoName?: string;
};

// GitHub Repository type from API
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
}

interface ContributorsTableProps {
  repositories?: GitHubRepo[];
  loading?: boolean;
}

const statusColors = {
  Active: "bg-green-500/20 text-green-400 border-green-500/30",
  Inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  "In Progress": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const techColors = {
  "Next.js": "bg-blue-500/20 text-blue-400",
  "React": "bg-cyan-500/20 text-cyan-400",
  "TypeScript": "bg-blue-600/20 text-blue-300",
  "Python": "bg-green-600/20 text-green-300",
  "Rust": "bg-orange-500/20 text-orange-400",
  "JavaScript": "bg-yellow-500/20 text-yellow-300",
  "Java": "bg-red-500/20 text-red-400",
  "C++": "bg-pink-500/20 text-pink-400",
  "Go": "bg-cyan-600/20 text-cyan-300",
  "PHP": "bg-purple-500/20 text-purple-400",
  "Ruby": "bg-red-600/20 text-red-300",
  "Swift": "bg-orange-600/20 text-orange-300",
  "Kotlin": "bg-purple-600/20 text-purple-300",
  "Dart": "bg-blue-500/20 text-blue-400",
  "C#": "bg-green-500/20 text-green-400",
  "HTML": "bg-orange-500/20 text-orange-400",
  "CSS": "bg-blue-400/20 text-blue-300",
  "Shell": "bg-gray-500/20 text-gray-400",
  "Vue": "bg-green-400/20 text-green-300",
};

// Transform GitHub repo data to Project format
const transformGitHubRepo = (repo: GitHubRepo): Project => {
  const daysSinceUpdate = Math.floor((Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24));
  
  let status: "Active" | "Inactive" | "In Progress" = "Active";
  if (daysSinceUpdate > 30) {
    status = "Inactive";
  } else if (repo.open_issues_count > 5) {
    status = "In Progress";
  }

  return {
    id: repo.id.toString(),
    title: repo.name,
    repo: repo.html_url,
    status,
    team: repo.private ? "Private Team" : "Public",
    tech: repo.language || "Unknown",
    createdAt: repo.created_at,
    contributors: [
      {
        name: repo.owner.login,
        email: `${repo.owner.login}@github.com`,
        avatar: repo.owner.avatar_url,
        role: "Owner",
      }
    ],
    stars: repo.stargazers_count,
    commits: repo.forks_count, // Using forks as a proxy for activity
    lastUpdated: daysSinceUpdate === 0 ? "Today" : 
                 daysSinceUpdate === 1 ? "1 day ago" : 
                 daysSinceUpdate < 7 ? `${daysSinceUpdate} days ago` :
                 daysSinceUpdate < 30 ? `${Math.floor(daysSinceUpdate / 7)} weeks ago` :
                 `${Math.floor(daysSinceUpdate / 30)} months ago`,
         description: repo.description || undefined,
    owner: repo.owner.login,
    repoName: repo.name,
  };
};

export default function ContributorsTable({ repositories = [], loading = false }: ContributorsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState({
    project: true,
    repository: true,
    team: true,
    tech: true,
    status: true,
    contributors: true,
    stats: true,
    actions: true,
  });

  // Transform GitHub repositories to Project format
  const data = repositories.map(transformGitHubRepo);

  const filteredData = data.filter(
    (project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tech.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: !prev[column] }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-purple-500/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3" asChild>
            <Link href="/github">
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">GitHub Deep Dive</span>
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm px-2 sm:px-3">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-black/90 border-white/10 backdrop-blur-xl">
              {Object.entries(visibleColumns).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  className="text-white hover:bg-white/10"
                  checked={value}
                  onCheckedChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden w-full">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                {visibleColumns.project && (
                  <TableHead className="text-gray-300 font-semibold min-w-[200px] max-w-[300px]">Project</TableHead>
                )}
                {visibleColumns.repository && (
                  <TableHead className="text-gray-300 font-semibold min-w-[180px] max-w-[240px]">Repository</TableHead>
                )}
                {visibleColumns.team && (
                  <TableHead className="text-gray-300 font-semibold min-w-[80px] max-w-[100px]">Visibility</TableHead>
                )}
                {visibleColumns.tech && (
                  <TableHead className="text-gray-300 font-semibold min-w-[100px] max-w-[120px]">Language</TableHead>
                )}
                {visibleColumns.status && (
                  <TableHead className="text-gray-300 font-semibold min-w-[90px] max-w-[110px]">Status</TableHead>
                )}
                {visibleColumns.stats && (
                  <TableHead className="text-gray-300 font-semibold min-w-[100px] max-w-[120px]">Stats</TableHead>
                )}
                {visibleColumns.contributors && (
                  <TableHead className="text-gray-300 font-semibold min-w-[100px] max-w-[120px]">Owner</TableHead>
                )}
                {visibleColumns.actions && (
                  <TableHead className="text-gray-300 font-semibold min-w-[100px] max-w-[120px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((project) => (
                <TableRow
                  key={project.id}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  {visibleColumns.project && (
                    <TableCell className="py-4 min-w-[200px] max-w-[300px]">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                          {project.title}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-gray-400 line-clamp-2 break-words">
                            {project.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">Created {new Date(project.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.repository && (
                    <TableCell className="py-4 min-w-[180px] max-w-[240px]">
                      <Link
                        href={project.repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group/link"
                      >
                        <GitBranch className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-mono truncate">
                          {project.owner}/{project.repoName}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                      </Link>
                    </TableCell>
                  )}

                  {visibleColumns.team && (
                    <TableCell className="py-4 min-w-[80px] max-w-[100px]">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">{project.team}</span>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.tech && (
                    <TableCell className="py-4 min-w-[100px] max-w-[120px]">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium border-0 truncate max-w-full",
                          techColors[project.tech as keyof typeof techColors] || "bg-gray-500/20 text-gray-400"
                        )}
                      >
                        <Code className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{project.tech}</span>
                      </Badge>
                    </TableCell>
                  )}

                  {visibleColumns.status && (
                    <TableCell className="py-4 min-w-[90px] max-w-[110px]">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-medium border truncate max-w-full",
                          statusColors[project.status]
                        )}
                      >
                        <span className="truncate">{project.status}</span>
                      </Badge>
                    </TableCell>
                  )}

                  {visibleColumns.stats && (
                    <TableCell className="py-4 min-w-[100px] max-w-[120px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-gray-400">
                            <Star className="w-3 h-3 flex-shrink-0" />
                            {project.stars || 0}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400">
                            <GitBranch className="w-3 h-3 flex-shrink-0" />
                            {project.commits || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          Updated {project.lastUpdated || 'recently'}
                        </p>
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.contributors && (
                    <TableCell className="py-4 min-w-[100px] max-w-[120px]">
                      <div className="flex items-center space-x-2">
                        <div className="flex -space-x-2">
                          {project.contributors.slice(0, 2).map((contributor: Contributor, idx: number) => (
                            <TooltipProvider key={idx}>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Avatar className="w-8 h-8 border-2 border-black hover:z-10 transition-transform hover:scale-110">
                                    <AvatarImage
                                      src={contributor.avatar}
                                      alt={contributor.name}
                                    />
                                    <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                      {contributor.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black/90 border-white/10 text-white">
                                  <div className="text-center">
                                    <p className="font-semibold">{contributor.name}</p>
                                    <p className="text-xs text-gray-400">{contributor.role}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                        {project.contributors.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{project.contributors.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.actions && (
                    <TableCell className="py-4 min-w-[100px] max-w-[120px]">
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                                asChild
                              >
                                <Link href={`/github/${project.owner}/${project.repoName}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/90 border-white/10 text-white">
                              View Details
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
                                asChild
                              >
                                <Link href="/proof/generate">
                                  <Zap className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black/90 border-white/10 text-white">
                              Generate Proof
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-black/90 border-white/10 backdrop-blur-xl">
                            <DropdownMenuCheckboxItem className="text-white hover:bg-white/10" asChild>
                              <Link href={project.repo} target="_blank">
                                View Repository
                              </Link>
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem className="text-white hover:bg-white/10" asChild>
                              <Link href="/proof/generate">
                                Generate Credential
                              </Link>
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem className="text-white hover:bg-white/10" asChild>
                              <Link href={`/github/${project.owner}/${project.repoName}`}>
                                View Analytics
                              </Link>
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredData.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GitBranch className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No projects found</h3>
          <p className="text-gray-400">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
} 