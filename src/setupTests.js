// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Several legacy suites replace individual router hooks. CRA resets jest mocks
// before every test, so restore safe defaults first; each suite can still
// override them in its own beforeEach.
beforeEach(() => {
  const router = require('react-router-dom');
  if (router.useNavigate?.mockImplementation) {
    router.useNavigate.mockImplementation(() => router.__mockNavigate || jest.fn());
  }
  if (router.useParams?.mockImplementation) router.useParams.mockImplementation(() => ({}));
  if (router.useLocation?.mockImplementation) {
    router.useLocation.mockImplementation(() => ({ pathname: '/', search: '', hash: '', state: null, key: 'test' }));
  }
  if (router.useSearchParams?.mockImplementation) {
    router.useSearchParams.mockImplementation(() => [new URLSearchParams(), router.__mockSetSearchParams || jest.fn()]);
  }
});
