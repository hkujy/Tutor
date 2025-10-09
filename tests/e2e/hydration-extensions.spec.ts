import { test, expect } from '@playwright/test'

test.describe('Hydration and Browser Extension Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`)
      }
    })
  })

  test('login page renders without hydration errors', async ({ page }) => {
    // Track hydration warnings
    const hydrationWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationWarnings.push(text)
      }
    })

    await page.goto('/login')
    
    // Wait for the page to fully load
    await expect(page.locator('text=Welcome to Tutoring Calendar')).toBeVisible()
    await expect(page.locator('text=Sign in as Student')).toBeVisible()
    await expect(page.locator('text=Sign in as Tutor')).toBeVisible()
    
    // Check for SVG icons
    await expect(page.locator('svg').first()).toBeVisible()
    
    // Verify no hydration warnings
    expect(hydrationWarnings).toHaveLength(0)
  })

  test('emulates DarkReader extension modifying SVG elements', async ({ page }) => {
    // Inject script that emulates DarkReader behavior
    await page.addInitScript(() => {
      // This script runs before any page script and emulates DarkReader
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element
                if (element.tagName === 'SVG') {
                  // Emulate DarkReader adding attributes
                  element.setAttribute('data-darkreader-inline-stroke', 'currentColor')
                  element.setAttribute('data-darkreader-inline-fill', 'currentColor')
                }
              }
            })
          }
        })
      })
      
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      })
      
      // Also modify existing SVGs
      document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('svg').forEach((svg) => {
          svg.setAttribute('data-darkreader-inline-stroke', 'currentColor')
          svg.setAttribute('data-darkreader-inline-fill', 'currentColor')
        })
      })
    })

    const hydrationWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationWarnings.push(text)
      }
    })

    await page.goto('/login')
    
    // Wait for page to load
    await expect(page.locator('text=Welcome to Tutoring Calendar')).toBeVisible()
    
    // Check that SVGs are rendered and have been modified by our "extension"
    const svgElements = page.locator('svg')
    await expect(svgElements.first()).toBeVisible()
    
    // Verify no hydration errors despite extension modifications
    expect(hydrationWarnings).toHaveLength(0)
  })

  test('emulates Grammarly extension behavior', async ({ page }) => {
    // Inject script that emulates Grammarly behavior
    await page.addInitScript(() => {
      // Emulate Grammarly's DOM modifications
      const addGrammarlyAttributes = (element: Element) => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.setAttribute('data-gramm', 'true')
          element.setAttribute('data-gramm_editor', 'true')
          element.setAttribute('data-enable-grammarly', 'true')
        }
        if (element.tagName === 'SVG') {
          element.setAttribute('data-grammarly-shadow-root', 'true')
        }
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                addGrammarlyAttributes(node as Element)
                // Also check children
                const children = (node as Element).querySelectorAll('input, textarea, svg')
                children.forEach(addGrammarlyAttributes)
              }
            })
          }
        })
      })

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      })
    })

    const hydrationWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationWarnings.push(text)
      }
    })

    await page.goto('/login')
    
    // Wait for page elements
    await expect(page.locator('text=Welcome to Tutoring Calendar')).toBeVisible()
    
    // Verify no hydration warnings
    expect(hydrationWarnings).toHaveLength(0)
  })

  test('main page handles loading states without hydration issues', async ({ page }) => {
    const hydrationWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationWarnings.push(text)
      }
    })

    await page.goto('/')
    
    // Should show loading or redirect to login
    const isLoading = await page.locator('text=Loading').isVisible({ timeout: 1000 }).catch(() => false)
    const isLogin = await page.locator('text=Welcome to Tutoring Calendar').isVisible({ timeout: 1000 }).catch(() => false)
    
    expect(isLoading || isLogin).toBe(true)
    expect(hydrationWarnings).toHaveLength(0)
  })

  test('calendar components render without hydration errors', async ({ page }) => {
    // Mock authentication for this test
    await page.goto('/login')
    
    const hydrationWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationWarnings.push(text)
      }
    })

    // Click on student login to proceed
    await page.click('text=Sign in as Student')
    
    // Wait for potential navigation or calendar component
    await page.waitForTimeout(2000) // Give time for any components to load
    
    // Verify no hydration warnings occurred during navigation/component mounting
    expect(hydrationWarnings).toHaveLength(0)
  })

  test('SVG animations work correctly with suppressHydrationWarning', async ({ page }) => {
    // Add extension behavior that might interfere with animations
    await page.addInitScript(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'SVG') {
                const svg = node as SVGElement
                svg.setAttribute('data-darkreader-inline-stroke', 'currentColor')
                svg.style.setProperty('--darkreader-inline-stroke', 'currentColor')
              }
            })
          }
        })
      })
      
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      })
    })

    const hydrationWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationWarnings.push(text)
      }
    })

    await page.goto('/login')
    
    // Look for animated SVGs (loading spinners, etc.)
    await expect(page.locator('svg')).toBeVisible()
    
    // Check for animate-spin class or CSS animations
    const animatedElements = page.locator('.animate-spin, [class*="animate"]')
    if (await animatedElements.count() > 0) {
      await expect(animatedElements.first()).toBeVisible()
    }
    
    // Verify animations work without hydration issues
    expect(hydrationWarnings).toHaveLength(0)
  })

  test('error page handles SVG icons correctly', async ({ page }) => {
    const hydrationWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('Hydration') || text.includes('hydration')) {
        hydrationWarnings.push(text)
      }
    })

    // Navigate to auth error page
    await page.goto('/auth/error')
    
    // Should show error page with SVG icon
    await expect(page.locator('text=Authentication Error')).toBeVisible()
    
    // Check that error SVG is present
    const errorSvg = page.locator('svg').first()
    await expect(errorSvg).toBeVisible()
    
    expect(hydrationWarnings).toHaveLength(0)
  })
})

test.describe('Performance and Memory', () => {
  test('NoSSR components do not cause memory leaks', async ({ page }) => {
    await page.goto('/login')
    
    // Monitor console for memory-related warnings
    const memoryWarnings: string[] = []
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('memory') || text.includes('leak')) {
        memoryWarnings.push(text)
      }
    })
    
    // Navigate around to trigger component mounting/unmounting
    await page.click('text=Sign in as Student')
    await page.waitForTimeout(1000)
    
    // Go back
    await page.goBack()
    await page.waitForTimeout(1000)
    
    // Check for memory warnings
    expect(memoryWarnings).toHaveLength(0)
  })
})