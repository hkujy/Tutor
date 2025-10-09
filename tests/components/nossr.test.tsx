import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import NoSSR from '../../src/components/NoSSR'

describe('NoSSR Component', () => {
  test('does not render children during SSR', () => {
    // Mock the useEffect to simulate SSR environment
    const originalUseEffect = React.useEffect
    React.useEffect = jest.fn()

    render(
      <NoSSR>
        <div data-testid="client-only-content">Client Only Content</div>
      </NoSSR>
    )

    // Should not render children during SSR
    expect(screen.queryByTestId('client-only-content')).not.toBeInTheDocument()

    // Restore useEffect
    React.useEffect = originalUseEffect
  })

  test('renders children after mounting on client', async () => {
    render(
      <NoSSR>
        <div data-testid="client-only-content">Client Only Content</div>
      </NoSSR>
    )

    // Should render children after mounting
    await waitFor(() => {
      expect(screen.getByTestId('client-only-content')).toBeInTheDocument()
    })

    expect(screen.getByText('Client Only Content')).toBeInTheDocument()
  })

  test('renders fallback content during SSR when provided', () => {
    const originalUseEffect = React.useEffect
    React.useEffect = jest.fn()

    render(
      <NoSSR fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="client-only-content">Client Only Content</div>
      </NoSSR>
    )

    // Should render fallback during SSR
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByTestId('client-only-content')).not.toBeInTheDocument()

    React.useEffect = originalUseEffect
  })

  test('replaces fallback with children after mounting', async () => {
    // Mock useState to control the initial mounted state
    const originalUseState = React.useState
    let mountedState = false
    const mockSetMounted = jest.fn((value: boolean) => { mountedState = value })
    
    const mockUseState = jest.fn((initial: any) => {
      if (typeof initial === 'boolean') {
        return [mountedState, mockSetMounted]
      }
      return originalUseState(initial)
    });
    
    (React as any).useState = mockUseState

    const { rerender } = render(
      <NoSSR fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="client-only-content">Client Only Content</div>
      </NoSSR>
    )

    // Initially should show fallback (component starts unmounted)
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('client-only-content')).not.toBeInTheDocument()

    // Simulate the useEffect call that sets mounted to true
    act(() => {
      mountedState = true
      mockSetMounted(true)
    })
    
    // Rerender to reflect the state change
    rerender(
      <NoSSR fallback={<div data-testid="fallback">Loading...</div>}>
        <div data-testid="client-only-content">Client Only Content</div>
      </NoSSR>
    )

    // After mounting, should show children and remove fallback
    await waitFor(() => {
      expect(screen.getByTestId('client-only-content')).toBeInTheDocument()
    })

    // Verify fallback is hidden and content is shown
    const fallbackElement = screen.queryByTestId('fallback')
    const clientContent = screen.queryByTestId('client-only-content')
    
    if (fallbackElement !== null) {
      throw new Error('Fallback should not be visible')
    }
    
    if (clientContent === null) {
      throw new Error('Client content should be visible')
    }

    (React as any).useState = originalUseState
  })

  test('handles multiple children correctly', async () => {
    render(
      <NoSSR>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <span data-testid="child-3">Child 3</span>
      </NoSSR>
    )

    await waitFor(() => {
      expect(screen.getByTestId('child-1')).toBeInTheDocument()
    })

    expect(screen.getByTestId('child-2')).toBeInTheDocument()
    expect(screen.getByTestId('child-3')).toBeInTheDocument()
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  test('prevents hydration mismatch with browser extensions', async () => {
    // Simulate browser extension that modifies DOM
    const originalQuerySelector = document.querySelector
    document.querySelector = jest.fn().mockImplementation((selector) => {
      const element = originalQuerySelector.call(document, selector)
      if (element && selector.includes('svg')) {
        // Simulate extension adding attributes
        element.setAttribute('data-darkreader-inline-stroke', 'true')
        element.setAttribute('data-grammarly-shadow-root', 'true')
      }
      return element
    })

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <NoSSR>
        <svg data-testid="test-svg" viewBox="0 0 24 24">
          <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z" />
        </svg>
      </NoSSR>
    )

    await waitFor(() => {
      expect(screen.getByTestId('test-svg')).toBeInTheDocument()
    })

    // Should not have hydration mismatch warnings
    const hydrationErrors = consoleSpy.mock.calls.filter(call =>
      call[0]?.includes?.('Hydration') || call[0]?.includes?.('hydration')
    )
    expect(hydrationErrors).toHaveLength(0)

    // Restore mocks
    document.querySelector = originalQuerySelector
    consoleSpy.mockRestore()
  })

  test('works with complex nested components', async () => {
    const ComplexComponent = () => (
      <div data-testid="complex-component">
        <h1>Complex Component</h1>
        <div>
          <span>Nested content</span>
          <button>Action Button</button>
        </div>
      </div>
    )

    render(
      <NoSSR>
        <ComplexComponent />
      </NoSSR>
    )

    await waitFor(() => {
      expect(screen.getByTestId('complex-component')).toBeInTheDocument()
    })

    expect(screen.getByText('Complex Component')).toBeInTheDocument()
    expect(screen.getByText('Nested content')).toBeInTheDocument()
    expect(screen.getByText('Action Button')).toBeInTheDocument()
  })
})

describe('NoSSR Performance', () => {
  test('minimizes re-renders', async () => {
    let renderCount = 0
    const TestComponent = () => {
      renderCount++
      return <div data-testid="test-component">Render count: {renderCount}</div>
    }

    render(
      <NoSSR>
        <TestComponent />
      </NoSSR>
    )

    await waitFor(() => {
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    // Should only render once after mounting
    expect(renderCount).toBe(1)
    expect(screen.getByText('Render count: 1')).toBeInTheDocument()
  })
})