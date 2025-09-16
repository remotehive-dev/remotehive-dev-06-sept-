import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
    useParams: () => ({}),
  }
})

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    isSignedIn: false,
    userId: null,
    getToken: vi.fn(),
  }),
  useUser: () => ({
    user: null,
    isLoaded: true,
  }),
  SignIn: ({ children }: { children: React.ReactNode }) => children,
  SignUp: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => null,
}))

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:8000',
    VITE_AUTOSCRAPER_API_URL: 'http://localhost:8001',
  },
})