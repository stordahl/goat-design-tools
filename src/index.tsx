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

// Helper function to capitalize category names
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

app.get('/', (c) => {
  // For now, we'll hardcode the known categories since Vite can't dynamically discover files at runtime
  // This could be improved by generating this list at build time
  const categories = ['typography', 'color']
  
  return c.render(
    <div>
      <h1>Design Tools</h1>
      <p>Browse our collection of design tools by category:</p>
      <ul>
        {categories.map((category) => (
          <li key={category}>
            <a href={`/${category}`}>
              <h2>{capitalize(category)} Tools</h2>
            </a>
          </li>
        ))}
      </ul>
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
    <div>
      <h1>{capitalize(category)} Tools</h1>
      <ul>
        {tools.map((tool: any) => (
          <li key={tool.slug}>
            <a href={`/${category}/${tool.slug}`}>
              <h2>{tool.name}</h2>
              <p>{tool.description}</p>
              <div>
                {tool.tags.map((tag: string) => (
                  <span key={tag} style={{ marginRight: '8px', padding: '2px 6px', backgroundColor: '#f0f0f0', borderRadius: '3px' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: '24px' }}>
        <a href="/">← Back to All Categories</a>
      </div>
    </div>
  )
})

// Dynamic individual tool route
app.get('/:category/:slug', async (c) => {
  const category = c.req.param('category')
  const slug = c.req.param('slug')
  const tools = await loadToolsForCategory(category)
  
  if (!tools) {
    return c.notFound()
  }
  
  const tool = tools.find((t: any) => t.slug === slug)
  
  if (!tool) {
    return c.notFound()
  }
  
  return c.render(
    <div>
      <h1>{tool.name}</h1>
      <p>{tool.description}</p>
      <a href={tool.url} target="_blank" rel="noopener noreferrer">
        Visit Tool →
      </a>
      <div style={{ marginTop: '16px' }}>
        <strong>Tags:</strong>
        <div style={{ marginTop: '8px' }}>
          {tool.tags.map((tag: string) => (
            <span key={tag} style={{ marginRight: '8px', padding: '4px 8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '24px' }}>
        <a href={`/${category}`}>← Back to {capitalize(category)} Tools</a>
      </div>
    </div>
  )
})

export default app
