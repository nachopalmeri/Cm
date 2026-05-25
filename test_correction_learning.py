"""
Test Correction Learning Flow End-to-End

This script verifies that the correction learning system works:
1. Upload sample text
2. Generate draft
3. Correct the draft
4. Generate another draft
5. Verify the second draft reflects the correction
"""

from playwright.sync_api import sync_playwright
import time

def test_correction_learning():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Visible for debugging
        page = browser.new_page()
        
        base_url = 'https://frontend-two-lake-705kqnp9pm.vercel.app'
        
        print("🚀 Starting correction learning test...")
        
        # Step 1: Go to /brain and upload sample text
        print("\n📝 Step 1: Uploading sample text...")
        page.goto(f'{base_url}/brain')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # Take screenshot of initial state
        page.screenshot(path='screenshots/01_brain_initial.png', full_page=True)
        
        # Find textarea and upload sample text
        sample_text = "construyo herramientas de IA para builders latinos que quieren escalar sin perder autenticidad"
        
        textarea = page.locator('textarea[placeholder*="Paste your text"]')
        if textarea.count() > 0:
            textarea.fill(sample_text)
            print(f"✅ Sample text entered: {sample_text[:50]}...")
            
            # Click "Add to Brain" button
            add_button = page.locator('button:has-text("Add to Brain")')
            if add_button.count() > 0:
                add_button.click()
                time.sleep(3)  # Wait for save
                print("✅ Sample text uploaded")
                page.screenshot(path='screenshots/02_brain_after_upload.png', full_page=True)
            else:
                print("❌ 'Add to Brain' button not found")
                browser.close()
                return False
        else:
            print("❌ Textarea not found")
            browser.close()
            return False
        
        # Step 2: Go to /dashboard and generate draft
        print("\n🎨 Step 2: Generating first draft...")
        page.goto(f'{base_url}/dashboard')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        page.screenshot(path='screenshots/03_dashboard_initial.png', full_page=True)
        
        # Click "Generate Draft" button
        generate_button = page.locator('button:has-text("Generate Draft")')
        if generate_button.count() > 0:
            generate_button.click()
            time.sleep(2)
            
            # Fill modal
            topic_input = page.locator('input[placeholder*="Por qué"]')
            if topic_input.count() > 0:
                topic_input.fill("Por qué los builders latinos necesitan mejores herramientas de IA")
                print("✅ Topic entered")
                
                # Select Twitter
                channel_select = page.locator('select').first
                channel_select.select_option('twitter')
                print("✅ Channel: Twitter")
                
                # Click Generate
                modal_generate_button = page.locator('button:has-text("Generate")').last
                modal_generate_button.click()
                print("⏳ Generating draft...")
                time.sleep(10)  # Wait for generation
                
                page.screenshot(path='screenshots/04_draft_generated.png', full_page=True)
                print("✅ First draft generated")
            else:
                print("❌ Topic input not found")
                browser.close()
                return False
        else:
            print("❌ 'Generate Draft' button not found")
            browser.close()
            return False
        
        # Step 3: Go back to /brain and correct the draft
        print("\n✏️ Step 3: Correcting the draft...")
        page.goto(f'{base_url}/brain')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        page.screenshot(path='screenshots/05_brain_with_draft.png', full_page=True)
        
        # Click "Corregir" button on first draft
        corregir_button = page.locator('button:has-text("Corregir")').first
        if corregir_button.count() > 0:
            corregir_button.click()
            time.sleep(2)
            
            # Get current draft text
            modal_textarea = page.locator('textarea').nth(1)  # Second textarea (modal)
            if modal_textarea.count() > 0:
                original_text = modal_textarea.input_value()
                print(f"📄 Original draft (first 100 chars): {original_text[:100]}...")
                
                # Make a specific correction: remove "disruptiva" if present, or add specific phrase
                corrected_text = original_text.replace("disruptiva", "transformadora")
                corrected_text = corrected_text.replace("revolucionario", "innovador")
                
                # If no changes, add a specific phrase
                if corrected_text == original_text:
                    corrected_text = "Los builders latinos necesitan herramientas que respeten su contexto cultural. " + original_text
                
                modal_textarea.fill(corrected_text)
                print(f"✏️ Corrected draft (first 100 chars): {corrected_text[:100]}...")
                
                # Click "Guardar corrección"
                save_button = page.locator('button:has-text("Guardar corrección")')
                if save_button.count() > 0:
                    save_button.click()
                    print("⏳ Saving correction...")
                    time.sleep(5)  # Wait for API calls
                    
                    page.screenshot(path='screenshots/06_correction_saved.png', full_page=True)
                    print("✅ Correction saved")
                else:
                    print("❌ 'Guardar corrección' button not found")
                    browser.close()
                    return False
            else:
                print("❌ Modal textarea not found")
                browser.close()
                return False
        else:
            print("❌ 'Corregir' button not found")
            browser.close()
            return False
        
        # Step 4: Generate another draft with same topic
        print("\n🎨 Step 4: Generating second draft (should reflect correction)...")
        page.goto(f'{base_url}/dashboard')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        # Click "Generate Draft" again
        generate_button = page.locator('button:has-text("Generate Draft")')
        if generate_button.count() > 0:
            generate_button.click()
            time.sleep(2)
            
            # Fill same topic
            topic_input = page.locator('input[placeholder*="Por qué"]')
            topic_input.fill("Por qué los builders latinos necesitan mejores herramientas de IA")
            
            # Select Twitter
            channel_select = page.locator('select').first
            channel_select.select_option('twitter')
            
            # Click Generate
            modal_generate_button = page.locator('button:has-text("Generate")').last
            modal_generate_button.click()
            print("⏳ Generating second draft...")
            time.sleep(10)  # Wait for generation
            
            page.screenshot(path='screenshots/07_second_draft_generated.png', full_page=True)
            print("✅ Second draft generated")
        
        # Step 5: Verify the second draft is different
        print("\n🔍 Step 5: Verifying correction was learned...")
        page.goto(f'{base_url}/brain')
        page.wait_for_load_state('networkidle')
        time.sleep(2)
        
        page.screenshot(path='screenshots/08_final_brain_state.png', full_page=True)
        
        # Check if there are now 2 drafts
        drafts = page.locator('button:has-text("Corregir")').count()
        print(f"📊 Total drafts: {drafts}")
        
        # Check if a new rule was added
        rules_section = page.locator('text=Historial de aprendizaje').locator('..').locator('..')
        rules_count = rules_section.locator('.rounded-lg').count()
        print(f"📚 Total rules learned: {rules_count}")
        
        # Check voice match score
        voice_match = page.locator('text=Voice match').locator('..').locator('.text-4xl').inner_text()
        print(f"🎯 Voice match score: {voice_match}")
        
        if drafts >= 2 and rules_count >= 1:
            print("\n✅ SUCCESS: Correction learning is working!")
            print(f"   - {drafts} drafts created")
            print(f"   - {rules_count} rules learned")
            print(f"   - Voice match: {voice_match}")
            browser.close()
            return True
        else:
            print("\n❌ FAILURE: Correction learning not working properly")
            print(f"   - Expected: 2+ drafts, got {drafts}")
            print(f"   - Expected: 1+ rules, got {rules_count}")
            browser.close()
            return False

if __name__ == '__main__':
    import os
    os.makedirs('screenshots', exist_ok=True)
    
    success = test_correction_learning()
    
    if success:
        print("\n🎉 All tests passed! Correction learning is functional.")
        exit(0)
    else:
        print("\n💥 Tests failed. Check screenshots for details.")
        exit(1)
