import React from 'react';

const navigate = jest.fn();
const setSearchParams = jest.fn();

export const useNavigate = jest.fn(() => navigate);
export const useParams = jest.fn(() => ({}));
export const useLocation = jest.fn(() => ({ pathname: '/', search: '', hash: '', state: null, key: 'test' }));
export const useSearchParams = jest.fn(() => [new URLSearchParams(), setSearchParams]);

export const Link = ({ children, to, ...props }) => <a href={typeof to === 'string' ? to : to?.pathname} {...props}>{children}</a>;
export const NavLink = ({ children, to, className, ...props }) => {
  const resolvedClass = typeof className === 'function' ? className({ isActive: false, isPending: false }) : className;
  return <a href={to} className={resolvedClass} {...props}>{children}</a>;
};
export const Navigate = ({ to, replace, state }) => <div data-testid="router-navigate" data-to={to} data-replace={String(Boolean(replace))} data-state={JSON.stringify(state || null)} />;
export const MemoryRouter = ({ children }) => <div data-testid="memory-router">{children}</div>;
export const BrowserRouter = ({ children }) => <div data-testid="browser-router">{children}</div>;
export const Routes = ({ children }) => <div data-testid="routes">{children}</div>;
export const Route = ({ element, children }) => element || children || null;
export const Outlet = () => <div data-testid="router-outlet">Outlet</div>;

export const __mockNavigate = navigate;
export const __mockSetSearchParams = setSearchParams;

export default {
  useNavigate, useParams, useLocation, useSearchParams,
  Link, NavLink, Navigate, MemoryRouter, BrowserRouter, Routes, Route, Outlet,
};
