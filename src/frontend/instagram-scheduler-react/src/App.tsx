import './styles/globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/auth/auth-context';
import { ApiConfigurator } from '@/auth/api-configurator';
import { AppRouting } from '@/routing/app-routing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiConfigurator />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="theme"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <HelmetProvider>
            <LoadingBarContainer>
              <BrowserRouter basename={BASE_URL}>
                <Toaster richColors position="top-right" />
                <AppRouting />
              </BrowserRouter>
            </LoadingBarContainer>
          </HelmetProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
