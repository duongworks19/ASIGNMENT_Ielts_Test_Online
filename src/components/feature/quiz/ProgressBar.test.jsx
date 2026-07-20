/**
 * Traceability Matrix:
 * - Feature: Practice Test & Quiz System
 * - Task: T010 - ProgressBar Component
 * - SPEC Requirement: "Progress Bar hiển thị phần trăm hoàn thành."
 * 
 * Test Cases:
 * 1. Happy Path: Should render correct percentage when valid completed and total are provided (0%, 50%, 100%).
 * 2. Boundary Value: Should render 0% if completed is 0.
 * 3. Boundary Value: Should render 100% if completed equals total.
 * 4. Error Case (Unwanted): Should render 0% if total is 0.
 * 5. Error Case (Unwanted): Should render 0% if total is negative.
 * 6. Error Case (Unwanted): Should render 0% if completed is negative.
 * 7. Error Case (Unwanted): Should cap at 100% if completed is greater than total.
 * 8. Error Case (Unwanted): Should handle non-number inputs gracefully (NaN, strings).
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressBar from './ProgressBar';

describe('ProgressBar Component', () => {
  
  // EARS[State-driven]: THE system SHALL display current completion percentage.
  it('renders correctly with 0%', () => {
    render(<ProgressBar completed={0} total={10} />);
    const progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 0%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  it('renders correctly with 50%', () => {
    render(<ProgressBar completed={5} total={10} />);
    const progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 50%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders correctly with 100%', () => {
    render(<ProgressBar completed={10} total={10} />);
    const progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 100%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  // EARS[Unwanted]: Handle negative total or zero
  it('renders 0% when total is 0 or negative', () => {
    const { rerender } = render(<ProgressBar completed={5} total={0} />);
    let progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 0%');

    rerender(<ProgressBar completed={5} total={-5} />);
    progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 0%');
  });

  // EARS[Unwanted]: Handle negative completed
  it('renders 0% when completed is negative', () => {
    render(<ProgressBar completed={-2} total={10} />);
    const progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 0%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  // EARS[Unwanted]: Handle completed > total
  it('caps at 100% when completed is greater than total', () => {
    render(<ProgressBar completed={15} total={10} />);
    const progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 100%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });

  // EARS[Unwanted]: Handle non-number inputs gracefully
  it('handles non-number inputs gracefully', () => {
    const { rerender } = render(<ProgressBar completed="string" total={10} />);
    let progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 0%');

    rerender(<ProgressBar completed={5} total="string" />);
    progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 0%');

    rerender(<ProgressBar completed={null} total={null} />);
    progressBar = screen.getByTestId('progress-bar-inner');
    expect(progressBar).toHaveStyle('width: 0%');
  });
});
