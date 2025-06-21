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
import { Eye, ExternalLink } from "lucide-react";
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
  owner?: string;
  name?: string;
};

interface ContributorsTableProps {
  data?: Project[];
  githubRepositories?: any[];
}

const defaultData: Project[] = [
  {
    id: "1",
    title: "ShadCN Clone",
    repo: "https://github.com/ruixenui/ruixen-buttons",
    status: "Active",
    team: "UI Guild",
    tech: "Next.js",
    createdAt: "2024-06-01",
    contributors: [
      {
        name: "Srinath G",
        email: "srinath@example.com",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        role: "UI Lead",
      },
      {
        name: "Kavya M",
        email: "kavya@example.com",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        role: "Designer",
      },
    ],
  },
  {
    id: "2",
    title: "RUIXEN Components",
    repo: "https://github.com/ruixenui/ruixen-buttons",
    status: "In Progress",
    team: "Component Devs",
    tech: "React",
    createdAt: "2024-05-22",
    contributors: [
      {
        name: "Arjun R",
        email: "arjun@example.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        role: "Developer",
      },
      {
        name: "Divya S",
        email: "divya@example.com",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        role: "QA",
      },
      {
        name: "Nikhil V",
        email: "nikhil@example.com",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        role: "UX",
      },
    ],
  },
  {
    id: "3",
    title: "CV Jobs Platform",
    repo: "https://github.com/ruixenui/ruixen-buttons",
    status: "Active",
    team: "CV Core",
    tech: "Spring Boot",
    createdAt: "2024-06-05",
    contributors: [
      {
        name: "Manoj T",
        email: "manoj@example.com",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
        role: "Backend Lead",
      },
    ],
  },
  {
    id: "4",
    title: "Ruixen UI Docs",
    repo: "https://github.com/ruixenui/ruixen-buttons",
    status: "Active",
    team: "Tech Writers",
    tech: "Markdown + Docusaurus",
    createdAt: "2024-04-19",
    contributors: [
      {
        name: "Sneha R",
        email: "sneha@example.com",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
        role: "Documentation",
      },
      {
        name: "Vinay K",
        email: "vinay@example.com",
        avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
        role: "Maintainer",
      },
    ],
  }
];

const allColumns = [
  "Project",
  "Repository",
  "Team",
  "Tech",
  "Created At",
  "Contributors",
  "Status",
  "Actions",
] as const;

function ContributorsTable({ data, githubRepositories }: ContributorsTableProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>([...allColumns]);
  const [statusFilter, setStatusFilter] = useState("");
  const [techFilter, setTechFilter] = useState("");

  // Convert GitHub repositories to our data format if provided
  const processedData = githubRepositories ? githubRepositories.map((repo, index) => ({
    id: repo.id?.toString() || index.toString(),
    title: repo.name || 'Unknown Repository',
    repo: repo.html_url || '#',
    status: repo.private ? "Private" as const : "Active" as const,
    team: repo.owner?.login || 'Unknown',
    tech: repo.language || 'Unknown',
    createdAt: repo.created_at ? new Date(repo.created_at).toLocaleDateString() : 'Unknown',
    contributors: repo.collaborators || [{
      name: repo.owner?.login || 'Unknown',
      email: 'email@example.com',
      avatar: repo.owner?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'Owner',
    }],
    owner: repo.owner?.login,
    name: repo.name,
  })) : (data || defaultData);

  const filteredData = processedData.filter((project) => {
    return (
      (!statusFilter || project.status === statusFilter) &&
      (!techFilter || project.tech.toLowerCase().includes(techFilter.toLowerCase()))
    );
  });

  const toggleColumn = (col: string) => {
    setVisibleColumns((prev) =>
      prev.includes(col)
        ? prev.filter((c) => c !== col)
        : [...prev, col]
    );
  };

  return (
    <div className="container my-10 space-y-4 p-6 border border-border rounded-lg bg-background shadow-sm overflow-x-auto">
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Filter by technology..."
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="w-48"
          />
          <Input
            placeholder="Filter by status..."
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {allColumns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col}
                checked={visibleColumns.includes(col)}
                onCheckedChange={() => toggleColumn(col)}
              >
                {col}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table className="w-full">
        <TableHeader>
          <TableRow>
            {visibleColumns.includes("Project") && <TableHead className="w-[180px]">Project</TableHead>}
            {visibleColumns.includes("Repository") && <TableHead className="w-[220px]">Repository</TableHead>}
            {visibleColumns.includes("Team") && <TableHead className="w-[150px]">Team</TableHead>}
            {visibleColumns.includes("Tech") && <TableHead className="w-[150px]">Tech</TableHead>}
            {visibleColumns.includes("Created At") && <TableHead className="w-[120px]">Created At</TableHead>}
            {visibleColumns.includes("Contributors") && <TableHead className="w-[150px]">Contributors</TableHead>}
            {visibleColumns.includes("Status") && <TableHead className="w-[100px]">Status</TableHead>}
            {visibleColumns.includes("Actions") && <TableHead className="w-[120px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length ? (
            filteredData.map((project) => (
              <TableRow key={project.id}>
                {visibleColumns.includes("Project") && (
                  <TableCell className="font-medium whitespace-nowrap">{project.title}</TableCell>
                )}
                {visibleColumns.includes("Repository") && (
                  <TableCell className="whitespace-nowrap">
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline flex items-center gap-1"
                    >
                      {project.repo.replace("https://", "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                )}
                {visibleColumns.includes("Team") && <TableCell className="whitespace-nowrap">{project.team}</TableCell>}
                {visibleColumns.includes("Tech") && <TableCell className="whitespace-nowrap">{project.tech}</TableCell>}
                {visibleColumns.includes("Created At") && <TableCell className="whitespace-nowrap">{project.createdAt}</TableCell>}
                {visibleColumns.includes("Contributors") && (
                  <TableCell className="min-w-[120px]">
                    <div className="flex -space-x-2">
                      <TooltipProvider>
                                                 {project.contributors.slice(0, 3).map((contributor: Contributor, idx: number) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <Avatar className="h-8 w-8 ring-2 ring-white hover:z-10">
                                <AvatarImage src={contributor.avatar} alt={contributor.name} />
                                <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent className="text-sm">
                              <p className="font-semibold">{contributor.name}</p>
                              <p className="text-xs text-muted-foreground">{contributor.email}</p>
                              <p className="text-xs italic">{contributor.role}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {project.contributors.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium ring-2 ring-white">
                            +{project.contributors.length - 3}
                          </div>
                        )}
                      </TooltipProvider>
                    </div>
                  </TableCell>
                )}
                {visibleColumns.includes("Status") && (
                  <TableCell className="whitespace-nowrap">
                    <Badge
                      className={cn(
                        "whitespace-nowrap",
                        project.status === "Active" && "bg-green-500 text-white",
                        project.status === "Inactive" && "bg-gray-400 text-white",
                        project.status === "In Progress" && "bg-yellow-500 text-white",
                        project.status === "Private" && "bg-purple-500 text-white",
                      )}
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                )}
                {visibleColumns.includes("Actions") && (
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2">
                      {project.owner && project.name ? (
                        <Link href={`/github/${project.owner}/${project.name}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            View Details
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/github">
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={visibleColumns.length} className="text-center py-6">
                No repositories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default ContributorsTable; 