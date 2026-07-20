import React from 'react';

// Common hooks
export const useNavigate = jest.fn();
export const useParams = jest.fn();
export const useLocation = jest.fn();

// Common components
export const Link = ({ children, to, ...props }) => (
  <a href={to} {...props}>{children}</a>
);

export const NavLink = ({ children, to, ...props }) => (
  <a href={to} {...props}>{children}</a>
);

export const MemoryRouter = ({ children }) => <div>{children}</div>;
export const BrowserRouter = ({ children }) => <div>{children}</div>;
export const Routes = ({ children }) => <div>{children}</div>;
export const Route = ({ children }) => <div>{children}</div>;
export const Outlet = () => <div>Outlet</div>;

export default {
  useNavigate,
  useParams,
  useLocation,
  Link,
  NavLink,
  MemoryRouter,
  BrowserRouter,
  Routes,
  Route,
  Outlet
};
