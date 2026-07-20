/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T011 - CountdownTimer Component
 * - SPEC Requirement: "Countdown Timer tự động submit khi hết giờ. Đổi màu đỏ khi < 5 phút."
 * 
 * Test Cases:
 * 1. Happy Path: Renders time correctly.
 * 2. State-driven: Adds text-danger class when < 5 mins remaining.
 * 3. Event-driven: Calls onExpire exactly once when time reaches 0.
 * 4. Error Case (Unwanted): Handles expireAt in the past by calling onExpire immediately.
 * 5. Error Case (Unwanted): Clears interval on unmount to prevent memory leaks.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CountdownTimer from './CountdownTimer';

describe('CountdownTimer Component', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders time correctly', () => {
    // Set current time to 12:00:00
    jest.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    // Expire at 12:15:30
    const expireAt = new Date('2026-06-11T12:15:30.000Z').getTime();
    const onExpireMock = jest.fn();

    render(<CountdownTimer expireAt={expireAt} onExpire={onExpireMock} />);
    
    const timerElement = screen.getByTestId('countdown-timer');
    expect(timerElement).toHaveTextContent('15:30');
    expect(timerElement).not.toHaveClass('text-danger');
  });

  // EARS[State-driven]
  it('adds text-danger class when less than 5 minutes remaining', () => {
    jest.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    // Expire at 12:04:59 (4 min 59 sec)
    const expireAt = new Date('2026-06-11T12:04:59.000Z').getTime();
    
    render(<CountdownTimer expireAt={expireAt} onExpire={jest.fn()} />);
    
    const timerElement = screen.getByTestId('countdown-timer');
    expect(timerElement).toHaveClass('text-danger');
  });

  // EARS[Event]
  it('calls onExpire when time reaches 0', () => {
    jest.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    // Expire in 2 seconds
    const expireAt = new Date('2026-06-11T12:00:02.000Z').getTime();
    const onExpireMock = jest.fn();

    render(<CountdownTimer expireAt={expireAt} onExpire={onExpireMock} />);
    
    expect(onExpireMock).not.toHaveBeenCalled();

    // Advance 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onExpireMock).not.toHaveBeenCalled();

    // Advance 1.5 seconds (past the expiration)
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    expect(onExpireMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('countdown-timer')).toHaveTextContent('00:00');
  });

  // EARS[Unwanted]
  it('calls onExpire immediately if expireAt is in the past', () => {
    jest.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    const expireAt = new Date('2026-06-11T11:59:00.000Z').getTime();
    const onExpireMock = jest.fn();

    render(<CountdownTimer expireAt={expireAt} onExpire={onExpireMock} />);
    
    expect(onExpireMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('countdown-timer')).toHaveTextContent('00:00');
  });

  // EARS[Unwanted] - clear interval
  it('clears interval on unmount', () => {
    jest.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    const expireAt = new Date('2026-06-11T12:15:00.000Z').getTime();
    const { unmount } = render(<CountdownTimer expireAt={expireAt} onExpire={jest.fn()} />);
    
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
