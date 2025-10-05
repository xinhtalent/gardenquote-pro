import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Quotes from "./pages/Quotes";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import ItemLibrary from "./pages/ItemLibrary";
import CreateQuote from "./pages/CreateQuote";
import QuoteDetail from "./pages/QuoteDetail";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col w-full">
              <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-10">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">ABC</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground hidden sm:inline">
                    Công ty Sân Vườn ABC
                  </span>
                </div>
              </header>
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/quotes" element={<Quotes />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customer/:phone" element={<CustomerDetail />} />
                  <Route path="/item-library" element={<ItemLibrary />} />
                  <Route path="/create-quote" element={<CreateQuote />} />
                  <Route path="/quote/:id" element={<QuoteDetail />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
