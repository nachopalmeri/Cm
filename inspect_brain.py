"""Quick inspection of /brain page to see what's actually there"""

from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    
    # Enable console logging
    page.on('console', lambda msg: print(f'CONSOLE: {msg.text}'))
    
    print("Opening /brain...")
    page.goto('https://frontend-two-lake-705kqnp9pm.vercel.app/brain')
    page.wait_for_load_state('networkidle')
    time.sleep(3)
    
    # Check what's on the page
    print("\n=== PAGE CONTENT ===")
    
    # Check for drafts section
    drafts_section = page.locator('text=Drafts generados')
    if drafts_section.count() > 0:
        print("✅ 'Drafts generados' section found")
        
        # Check for draft items
        draft_items = page.locator('button:has-text("Corregir")')
        print(f"📊 Number of 'Corregir' buttons: {draft_items.count()}")
        
        # Check all text in drafts section
        drafts_container = page.locator('text=Drafts generados').locator('..').locator('..')
        print(f"\nDrafts section HTML:\n{drafts_container.inner_html()[:500]}")
    else:
        print("❌ 'Drafts generados' section NOT found")
    
    # Check for errors
    errors = page.locator('.bg-red-50')
    if errors.count() > 0:
        print(f"\n⚠️ Errors on page: {errors.count()}")
        print(f"Error text: {errors.first.inner_text()}")
    
    # Check network requests
    print("\n=== Checking API calls ===")
    
    # Wait a bit and take screenshot
    time.sleep(2)
    page.screenshot(path='brain_inspection.png', full_page=True)
    print("\n📸 Screenshot saved: brain_inspection.png")
    
    input("\nPress Enter to close browser...")
    browser.close()
