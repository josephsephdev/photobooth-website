import { els } from './ui.js';
import { api } from './api.js';
import { selectTemplate } from './session.js';

export async function loadTemplates() {
  try {
    const result = await api('api/templates.json');

    if (result.success && result.templates.length > 0) {
      els.templateGrid.innerHTML = '';
      result.templates.forEach(template => {
        const container = document.createElement('div');
        container.className = 'template-selection-item';
        
        // Create button container with background image
        const button = document.createElement('button');
        button.className = 'template-image-button';
        button.setAttribute('aria-label', `Select ${template.name} template`);
        
        if (template.background) {
          button.style.backgroundImage = `url('${template.background}')`;
          button.style.backgroundSize = 'cover';
          button.style.backgroundPosition = 'center';
        } else {
          button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
        
        // Add overlay for better contrast
        const overlay = document.createElement('div');
        overlay.className = 'template-image-overlay';
        button.appendChild(overlay);
        
        // Add label
        const label = document.createElement('p');
        label.className = 'template-label';
        label.textContent = template.name;
        
        // Build container
        container.appendChild(button);
        container.appendChild(label);
        
        button.addEventListener('click', () => selectTemplate(template));
        els.templateGrid.appendChild(container);
      });
    } else {
      els.templateGrid.innerHTML = '<p style="color: white; text-align: center; font-size: 1.5em;">No templates found. Please create a template first!</p>';
    }
  } catch (error) {
    console.error('Error loading templates:', error);
    els.templateGrid.innerHTML = '<p style="color: white; text-align: center;">Error loading templates</p>';
  }
}
