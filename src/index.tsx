import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

// Helper function to load tools for a category using dynamic imports
async function loadToolsForCategory(category: string) {
  try {
    const module = await import(`./content/tools/${category}.json`)
    return module.default
  } catch (error) {
    return null
  }
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

app.get('/', (c) => {
  // For now, we'll hardcode the known categories since Vite can't dynamically discover files at runtime
  // This could be improved by generating this list at build time
  const categories = ['color', 'graphics', 'icons', 'image', 'inspiration', 'typography']
  
  return c.render(
      <div class="flex flex-col gap-5">
        {categories.map((category) => (
          <a
            key={category}
            href={`/${category}`}
            class="group peer block p-6 transition-all duration-300 border-3 border-dashed border-neutral-600 hover:border-red-500 text-neutral-600 text-5xl motion-safe:hover:tracking-widest overflow-hidden"
          >
            <h2 class="text-center font-semibold whitespace-nowrap text-neutral-600 group-hover:first:text-red-500 group-hover:not-first:text-neutral-600">
              {capitalize(category)}
            </h2>
          </a>
        ))}
      </div>
  )
})

// Dynamic category listing route
app.get('/:category', async (c) => {
  const category = c.req.param('category')
  const tools = await loadToolsForCategory(category)
  
  if (!tools) {
    return c.notFound()
  }
  
  return c.render(
    <div class="space-y-8">
      <div>
        <a 
          href="/" 
          class="inline-flex items-center text-neutral-400 hover:text-red-500 mb-6 transition-colors"
        >
          ‹ back
        </a>
        <h1 class="text-3xl font-bold text-neutral-50 mb-2">
          {capitalize(category)} Tools
        </h1>
        
        <div class="mt-6">
          <input
            type="text"
            id="search-input"
            placeholder={`Search ${category} tools...`}
            class="w-full p-3 border-3 border-dashed border-neutral-600 text-neutral-200 placeholder-neutral-500 focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
      
      <div id="tools-container" class="grid gap-6">
        {tools.map((tool: any) => (
          <a
            key={tool.slug}
            href={tool.url} 
            target="_blank" 
            rel="noopener noreferrer"
            class="tool-item group block p-6 w-full h-auto transition-all duration-300 border-3 border-dashed border-neutral-600 hover:border-red-500 text-neutral-600 hover:text-red-500"
            data-name={tool.name.toLowerCase()}
            data-description={tool.description.toLowerCase()}
            data-tags={tool.tags.join(' ').toLowerCase()}
          >
            <h2 class="text-3xl font-semibold mb-3 duration-300">
              {tool.name}
            </h2>
            <p class="transition-colors text-neutral-600 group-hover:text-neutral-300 mb-4 leading-relaxed">
              {tool.description}
            </p>
            <div class="flex flex-wrap gap-2">
              {tool.tags.map((tag: string, index: number) => (
                <span 
                  key={tag} 
                  class="transition-colors text-neutral-600 group-hover:text-neutral-400 text-sm font-medium"
                >
                  {tag}
                  {(index < (tool.tags.length - 1)) && " \\"}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>

      <div id="no-results" class="hidden text-center py-12">
        <p class="text-neutral-500 text-lg">No tools found matching your search.</p>
      </div>

      <script src={import.meta.env.PROD ? `/assets/search.js` : `/src/search.js`} />
    </div>
  )
})

export default app
