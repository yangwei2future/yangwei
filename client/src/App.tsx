import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CategoriesProvider } from "./contexts/CategoriesContext";
import Home from "./pages/Home";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import About from "./pages/About";
import Search from "./pages/Search";
import Admin from "./pages/Admin";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/articles" component={Articles} />
      <Route path="/article/:id" component={Article} />
      <Route path="/about" component={About} />
      <Route path="/search" component={Search} />
      <Route path="/admin" component={Admin} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <CategoriesProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CategoriesProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
