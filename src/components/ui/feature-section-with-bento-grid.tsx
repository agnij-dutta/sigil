import { Badge } from "@/components/ui/badge";
import { Shield, GitBranch, Users, FileCheck } from "lucide-react";

function Feature() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <div className="flex gap-4 flex-col items-start">
            <div>
              <Badge>Platform</Badge>
            </div>
            <div className="flex gap-2 flex-col">
              <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
                Verify Your Work
              </h2>
              <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground  text-left">
                Create verifiable proofs of your development contributions without exposing private code.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-muted rounded-md h-full lg:col-span-2 p-6 aspect-square lg:aspect-auto flex justify-between flex-col">
              <Shield className="w-8 h-8 stroke-1" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight">Privacy-First Verification</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Prove your contributions from private repositories without revealing any source code or sensitive information.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-md  aspect-square p-6 flex justify-between flex-col">
              <GitBranch className="w-8 h-8 stroke-1" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight">Real Contributions</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Generate cryptographic proofs based on actual Git commits and contribution history.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-md aspect-square p-6 flex justify-between flex-col">
              <Users className="w-8 h-8 stroke-1" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight">Trusted by Teams</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Build a reputation based on verified work that hiring managers can trust and verify.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-md h-full lg:col-span-2 p-6 aspect-square lg:aspect-auto flex justify-between flex-col">
              <FileCheck className="w-8 h-8 stroke-1" />
              <div className="flex flex-col">
                <h3 className="text-xl tracking-tight">Comprehensive Portfolio</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Showcase your skills across different languages, frameworks, and project types with verifiable evidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature }; 