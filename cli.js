#!/usr/bin/env node

import * as p from '@clack/prompts';
import { readdir, readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';

const TOOLS_DIR = './src/content/tools';

// Utility to create slug from string
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

// Fetch and parse HTML to extract title and description
async function extractInfoFromUrl(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    // Extract description from meta tag
    const descMatch = html.match(/<meta[^>]*name=['"](description|og:description)['"][^>]*content=['"]([^'"]+)['"]/i);
    const description = descMatch ? descMatch[2].trim() : null;
    
    return { title, description };
  } catch (error) {
    console.log(`Error fetching URL: ${error.message}`);
    return { title: null, description: null };
  }
}

// Get list of existing tool categories
async function getToolCategories() {
  try {
    const files = await readdir(TOOLS_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.log('Tools directory not found, creating it...');
    return [];
  }
}

// Create new tool category
async function createNewCategory() {
  const categoryName = await p.text({
    message: 'What is the name of the new tool category?',
    placeholder: 'e.g., Color Tools, Icons, etc.',
    validate: (value) => {
      if (!value) return 'Category name is required';
      if (value.length < 2) return 'Category name must be at least 2 characters';
    }
  });

  if (p.isCancel(categoryName)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  const slug = createSlug(categoryName);
  const filePath = join(TOOLS_DIR, `${slug}.json`);

  // Check if file already exists
  try {
    await access(filePath);
    const overwrite = await p.confirm({
      message: `Category "${categoryName}" already exists. Overwrite?`
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  } catch {
    // File doesn't exist, continue
  }

  // Create empty category file
  const emptyCategory = [];
  await writeFile(filePath, JSON.stringify(emptyCategory, null, 2));
  
  p.log.success(`Created new category: ${categoryName} (${slug}.json)`);
  
  const addTool = await p.confirm({
    message: 'Would you like to add a tool to this category now?'
  });

  if (!p.isCancel(addTool) && addTool) {
    await addToolToCategory(slug);
  }
}

// Add tool to existing category
async function addToolToCategory(categorySlug = null) {
  let selectedCategory = categorySlug;
  
  if (!selectedCategory) {
    const categories = await getToolCategories();
    
    if (categories.length === 0) {
      p.log.error('No tool categories found. Create a category first.');
      return;
    }

    selectedCategory = await p.select({
      message: 'Select a category to add the tool to:',
      options: categories.map(cat => ({ 
        value: cat, 
        label: cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
    });

    if (p.isCancel(selectedCategory)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  }

  const url = await p.text({
    message: 'Enter the tool URL:',
    placeholder: 'https://example.com',
    validate: (value) => {
      if (!value) return 'URL is required';
      try {
        new URL(value);
        return;
      } catch {
        return 'Please enter a valid URL';
      }
    }
  });

  if (p.isCancel(url)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  // Try to extract info from URL
  p.log.info('Fetching information from URL...');
  const { title, description } = await extractInfoFromUrl(url);

  let toolName = title;
  let toolDescription = description;

  // If we couldn't get the name, ask user
  if (!toolName) {
    toolName = await p.text({
      message: 'Could not extract tool name. Please enter it manually:',
      validate: (value) => {
        if (!value) return 'Tool name is required';
      }
    });

    if (p.isCancel(toolName)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  } else {
    // Ask if they want to use the extracted name
    const useName = await p.confirm({
      message: `Use extracted name: "${toolName}"?`
    });

    if (p.isCancel(useName)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    if (!useName) {
      toolName = await p.text({
        message: 'Enter the tool name:',
        validate: (value) => {
          if (!value) return 'Tool name is required';
        }
      });

      if (p.isCancel(toolName)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
    }
  }

  // If we couldn't get the description, ask user
  if (!toolDescription) {
    toolDescription = await p.text({
      message: 'Could not extract description. Please enter it manually:',
      validate: (value) => {
        if (!value) return 'Description is required';
      }
    });

    if (p.isCancel(toolDescription)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }
  } else {
    // Ask if they want to use the extracted description
    const useDesc = await p.confirm({
      message: `Use extracted description: "${toolDescription.substring(0, 100)}${toolDescription.length > 100 ? '...' : ''}"?`
    });

    if (p.isCancel(useDesc)) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    if (!useDesc) {
      toolDescription = await p.text({
        message: 'Enter the tool description:',
        validate: (value) => {
          if (!value) return 'Description is required';
        }
      });

      if (p.isCancel(toolDescription)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }
    }
  }

  // Get tags
  const tagsInput = await p.text({
    message: 'Enter tags (comma-separated):',
    placeholder: 'design, colors, palette',
    validate: (value) => {
      if (!value) return 'At least one tag is required';
    }
  });

  if (p.isCancel(tagsInput)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  const tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);

  // Create tool object
  const tool = {
    name: toolName,
    slug: createSlug(toolName),
    description: toolDescription,
    url,
    tags
  };

  // Read existing category file
  const filePath = join(TOOLS_DIR, `${selectedCategory}.json`);
  let existingTools = [];
  
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    existingTools = JSON.parse(fileContent);
  } catch (error) {
    p.log.warn('Could not read existing category file, creating new one.');
  }

  // Check for duplicate slugs
  const existingTool = existingTools.find(t => t.slug === tool.slug);
  if (existingTool) {
    const overwrite = await p.confirm({
      message: `A tool with slug "${tool.slug}" already exists. Overwrite?`
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel('Operation cancelled');
      process.exit(0);
    }

    // Remove existing tool
    existingTools = existingTools.filter(t => t.slug !== tool.slug);
  }

  // Add new tool
  existingTools.push(tool);

  // Write back to file
  await writeFile(filePath, JSON.stringify(existingTools, null, 2));
  
  p.log.success(`Added tool "${toolName}" to ${selectedCategory} category`);

  // Ask if they want to add another tool
  const addAnother = await p.confirm({
    message: 'Would you like to add another tool?'
  });

  if (!p.isCancel(addAnother) && addAnother) {
    await addToolToCategory();
  }
}

// Main CLI function
async function main() {
  console.clear();

  p.intro('🐐 Goat Design Tools CLI');

  const action = await p.select({
    message: 'What would you like to do?',
    options: [
      {
        value: 'create-category',
        label: '📁 Create a new tool category'
      },
      {
        value: 'add-tool',
        label: '🔧 Add a tool to existing category'
      }
    ]
  });

  if (p.isCancel(action)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  switch (action) {
    case 'create-category':
      await createNewCategory();
      break;
    case 'add-tool':
      await addToolToCategory();
      break;
  }

  p.outro('✨ Done!');
}

main().catch(console.error);