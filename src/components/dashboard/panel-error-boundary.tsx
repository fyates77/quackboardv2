import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  panelTitle: string;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <p className="text-sm font-medium">
            Panel "{this.props.panelTitle}" failed to render
          </p>
          <p className="text-xs text-muted-foreground">{this.state.error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            <RotateCcw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
