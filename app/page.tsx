import { Navbar } from "@/components/navbar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectionTest } from "@/components/connection-test";
import { CreateWorkspaceButton } from "@/components/create-workspace-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-16 items-center">
        <Navbar />
        
        <div className="flex-1 flex flex-col items-center justify-center p-5 space-y-12 max-w-4xl w-full">
          <ConnectionTest />
          
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Track Finances Together
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Share bank statements, auto-categorize expenses, and plan budgets with your partner or family
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">📊 Auto-Categorize</Badge>
              <Badge variant="secondary">🔗 Share via URL</Badge>
              <Badge variant="secondary">📈 Visual Charts</Badge>
              <Badge variant="secondary">🚫 No Sign-up</Badge>
            </div>
            
            <div className="w-full max-w-md mx-auto">
              <CreateWorkspaceButton />
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📤</span>
                  Upload & Share
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Drop your CSV bank statements and instantly share financial insights with your partner through a simple URL.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🏷️</span>
                  Smart Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Automatically categorize transactions into Food, Transport, Bills, and more. See where your money really goes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  Visual Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Beautiful charts show spending trends, category breakdowns, and help you make informed financial decisions together.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <div className="w-full max-w-3xl text-center space-y-6">
            <h2 className="text-2xl font-semibold">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-3xl">1️⃣</div>
                <h3 className="font-medium">Create Workspace</h3>
                <p className="text-muted-foreground">Generate a unique finance workspace in seconds</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">2️⃣</div>
                <h3 className="font-medium">Invite Partner</h3>
                <p className="text-muted-foreground">Share the URL with your partner or family</p>
              </div>
              <div className="space-y-2">
                <div className="text-3xl">3️⃣</div>
                <h3 className="font-medium">Upload & Analyze</h3>
                <p className="text-muted-foreground">Both upload bank statements and see combined insights</p>
              </div>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
