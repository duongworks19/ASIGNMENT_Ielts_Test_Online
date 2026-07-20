/**
 * TRACEABILITY MATRIX
 * -----------------------------------------------------------------------------------------
 * Test Case ID | Requirement / EARS Ref | Description
 * -----------------------------------------------------------------------------------------
 * TC_LCP_01    | SPEC §3 CL-07          | Render iframe player when contentUrl is an embed link.
 * TC_LCP_02    | SPEC §3 CL-07          | Render video player when contentUrl is an mp4 link.
 * TC_LCP_03    | SPEC §3 CL-07          | Render text content when available.
 * TC_LCP_04    | EARS[Unwanted]         | Render warning alert when both contentUrl and content are missing.
 * TC_LCP_05    | EARS[Unwanted]         | Render safe placeholder when lesson object is null/undefined.
 * -----------------------------------------------------------------------------------------
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LessonContentPlayer from './LessonContentPlayer';

describe('LessonContentPlayer Component', () => {

  // TC_LCP_01
  it('renders an iframe player when contentUrl is a generic embed link', () => {
    const lesson = { id: 'l-1', title: 'Test 1', contentUrl: 'https://youtube.com/embed/123' };
    render(<LessonContentPlayer lesson={lesson} />);
    
    expect(screen.getByTestId('iframe-player')).toBeInTheDocument();
    expect(screen.getByTestId('iframe-player')).toHaveAttribute('src', 'https://youtube.com/embed/123');
    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
  });

  // TC_LCP_02
  it('renders a video tag when contentUrl ends with .mp4', () => {
    const lesson = { id: 'l-2', title: 'Test 2', contentUrl: 'https://example.com/video.mp4' };
    render(<LessonContentPlayer lesson={lesson} />);
    
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    expect(screen.queryByTestId('iframe-player')).not.toBeInTheDocument();
  });

  // TC_LCP_03
  it('renders text content when content property exists', () => {
    const lesson = { id: 'l-3', title: 'Text Lesson', content: 'This is the lesson text.' };
    render(<LessonContentPlayer lesson={lesson} />);
    
    expect(screen.getByTestId('text-content')).toBeInTheDocument();
    expect(screen.getByText('This is the lesson text.')).toBeInTheDocument();
    expect(screen.queryByTestId('iframe-player')).not.toBeInTheDocument();
  });

  // TC_LCP_04
  it('shows a warning alert when both contentUrl and content are missing', () => {
    const lesson = { id: 'l-4', title: 'Empty Lesson' }; // no contentUrl, no content
    render(<LessonContentPlayer lesson={lesson} />);
    
    expect(screen.getByTestId('no-content-alert')).toBeInTheDocument();
    expect(screen.getByText(/No video or text content is available/i)).toBeInTheDocument();
  });

  // TC_LCP_05
  it('renders safe placeholder when lesson object is null', () => {
    render(<LessonContentPlayer lesson={null} />);
    
    expect(screen.getByText('Select a lesson')).toBeInTheDocument();
    expect(screen.getByText(/Choose a lesson from the sidebar/i)).toBeInTheDocument();
  });
});
