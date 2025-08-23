import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en" className="bg-neutral-950">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>GOAT Design Tools</title>
        <style>
          {`a {
              color: var(--color-neutral-500);
            }
            a:hover {
              color: var(--color-red-500);
            }
          `}
        </style>
        <link
          href={import.meta.env.PROD ? `/assets/style.css` : `/src/style.css`}
          rel="stylesheet"
        />
      </head>
      <body class="bg-neutral-950 text-neutral-50 min-h-screen bg-[url(/images/bg-texture.jpg)]">
        <div class="container mx-auto max-w-4xl px-4 py-8">
          <div class="space-y-8 flex flex-col">
            <header class="text-center" style={{'view-transition-name': 'header'}}>
              <img src="/images/logo.png" alt="" class="max-w-70 m-auto"/>
              <h1 class="text-4xl font-bold text-neutral-50 mb-1">G.O.A.T. Design Tools</h1>
              <p class="text-lg text-neutral-500 max-w-2xl mx-auto">
                free online tools for designers and creatives
              </p>
            </header>
            {children}
            <footer className="text-center text-neutral-500 flex justify-center gap-2 my-10">
              <span>© Jacob Stordahl {new Date().getFullYear()}</span>
              <span>|</span>
              <span><a href="https://stordahl.dev" target="_blank" className="hover:text-red-500">Hire me!</a></span>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
})
