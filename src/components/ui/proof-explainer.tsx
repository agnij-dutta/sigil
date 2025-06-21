import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Info, MessageCircle, HelpCircle, RefreshCw, EyeOff, CheckCircle } from "lucide-react";

interface ProofExplainerProps {
  proofType: string;  // e.g., "commit", "repository", "language", "collaboration"
  context?: string;   // Additional context about the proof
  publicSignals?: string[]; // Any public signals/inputs from the proof
  onClose?: () => void;
}

/**
 * ProofExplainer - Component to explain ZK proofs in user-friendly language
 * 
 * Uses Gemini API to generate explanations of different proof types and
 * presents them in an accessible way to users.
 */
export function ProofExplainer({
  proofType,
  context,
  publicSignals,
  onClose,
}: ProofExplainerProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [complexity, setComplexity] = useState<"simple" | "detailed">("simple");
  const [error, setError] = useState<string | null>(null);
  
  const fetchExplanation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofType,
          context: context || '',
          complexity,
          // Add any public signals as additional context if available
          ...(publicSignals && publicSignals.length > 0 
            ? { 
                additionalContext: `This proof has the following public signals: ${publicSignals.join(", ")}` 
              } 
            : {}
          ),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch explanation");
      }
      
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-fetch explanation on first render
  useEffect(() => {
    fetchExplanation();
  }, [proofType, complexity]);

  // Get an icon based on the proof type
  const getProofIcon = () => {
    switch (proofType.toLowerCase()) {
      case 'commit':
        return <CheckCircle className="w-5 h-5" />;
      case 'repository':
        return <Info className="w-5 h-5" />;
      case 'collaboration':
        return <MessageCircle className="w-5 h-5" />;
      case 'language':
        return <HelpCircle className="w-5 h-5" />;
      case 'privacy':
        return <EyeOff className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <Card className="p-6 bg-gray-950 border-gray-800 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-900/30 p-2 rounded-full">
            {getProofIcon()}
          </div>
          <h3 className="text-lg font-medium text-white">
            Understanding {proofType.charAt(0).toUpperCase() + proofType.slice(1)} Proofs
          </h3>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setComplexity(complexity === "simple" ? "detailed" : "simple")}
            className="text-xs"
          >
            {complexity === "simple" ? "Show Advanced" : "Show Simple"}
          </Button>
          
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>
      
      <div className="min-h-[150px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mb-2" />
            <p className="text-gray-400 text-sm">Generating explanation...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 p-4 rounded-md text-red-200 text-sm">
            <p>Error: {error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchExplanation}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 whitespace-pre-wrap">{explanation}</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
        <p className="text-xs text-gray-500">
          Powered by Gemini AI
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchExplanation}
          disabled={isLoading}
          className="text-xs flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Explanation
        </Button>
      </div>
    </Card>
  );
} 