import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminLayout from '../../layouts/AdminLayout';

const mockedUsedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }) => <div data-testid="memory-router">{children}</div>,
  Routes: ({ children }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }) => element,
  NavLink: ({ children, to, className }) => {
    // Provide a mocked isActive for the className function
    const activeClass = typeof className === 'function' ? className({ isActive: to === '/admin/users' }) : className;
    return <a href={to} className={activeClass}>{children}</a>;
  },
  Outlet: () => <div data-testid="mock-dashboard">Dashboard Content</div>,
  useNavigate: () => mockedUsedNavigate,
}), { virtual: true });

describe('AdminLayout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (initialRoute = '/admin/dashboard') => {
    // Since we mock react-router-dom, AdminLayout renders our mock Outlet directly.
    return render(<AdminLayout />);
  };

  test('[Happy Path 1 & 2] should render layout with sidebar, links and main content', () => {
    renderWithRouter();
    
    // Check Sidebar rendering
    const sidebar = screen.getByTestId('admin-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Check Navigation Links
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    const usersLink = screen.getByRole('link', { name: /Users Management/i });
    expect(dashboardLink).toBeInTheDocument();
    expect(usersLink).toBeInTheDocument();
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/admin/dashboard');
    expect(usersLink.closest('a')).toHaveAttribute('href', '/admin/users');

    // Check Main Content area renders Outlet children
    const mainContent = screen.getByTestId('admin-main-content');
    expect(mainContent).toBeInTheDocument();
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
  });

  test('[Happy Path 3] should apply active class to the correct navigation link', () => {
    renderWithRouter('/admin/users');
    
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    const usersLink = screen.getByRole('link', { name: /Users Management/i });
    
    // Since we are on /admin/users, usersLink should have 'active' class
    expect(usersLink.closest('a')).toHaveClass('active');
    expect(dashboardLink.closest('a')).not.toHaveClass('active');
  });

  test('[Boundary 1] should toggle mobile menu visibility when toggle button is clicked', () => {
    renderWithRouter();
    
    const toggleBtn = screen.getByTestId('mobile-menu-toggle');
    const sidebar = screen.getByTestId('admin-sidebar');
    
    // Initial state: not open on mobile (has 'd-none d-md-flex')
    expect(sidebar).toHaveClass('d-none');
    expect(sidebar).toHaveClass('d-md-flex');
    expect(sidebar).not.toHaveClass('d-flex');
    
    // Click to open
    fireEvent.click(toggleBtn);
    expect(sidebar).toHaveClass('d-flex');
    expect(sidebar).not.toHaveClass('d-none');
    
    // Click to close
    fireEvent.click(toggleBtn);
    expect(sidebar).toHaveClass('d-none');
  });

  test('[Happy Path 4] should clear localStorage and navigate to /login when logout is clicked', () => {
    // Setup initial state
    localStorage.setItem('ielts_auth_user', JSON.stringify({ id: 1, role: 'admin' }));
    
    renderWithRouter();
    
    const logoutBtn = screen.getByTestId('logout-button');
    fireEvent.click(logoutBtn);
    
    // Verify actions
    expect(localStorage.getItem('ielts_auth_user')).toBeNull();
    // Verify navigation by checking if useNavigate was called with /login
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/login');
  });
});
