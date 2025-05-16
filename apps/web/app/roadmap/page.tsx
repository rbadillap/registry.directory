"use client";

import React, { useState } from "react";
import Link from "next/link";

const Roadmap = () => {
  const [activeTab, setActiveTab] = useState("premium");

  return (
    <main className="flex min-h-screen flex-col items-center py-20 px-4 md:px-8 lg:px-12">
      <div className="w-full max-w-3xl">
        {/* Header with back to home link */}
        <div className="flex items-center mb-10">
          <a 
            href="https://registry.directory" 
            className="text-sm font-medium font-mono flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-muted-foreground"
            >
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
            </svg>
            <span>
              registry<span className="text-muted-foreground">.directory</span>
            </span>
          </a>
        </div>
        
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-mono font-bold mb-2">Roadmap</h1>
          <p className="text-sm text-muted-foreground font-mono">
            Our vision for building the central hub for all shadcn/ui registries
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-border">
            <button 
              className={`px-4 py-2 text-sm font-mono transition-colors ${activeTab === "open-source" ? "border-b-2 border-rose-700 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("open-source")}
            >
              Open Source
            </button>
            <button 
              className={`px-4 py-2 text-sm font-mono transition-colors ${activeTab === "premium" ? "border-b-2 border-rose-700 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("premium")}
            >
              <span className="relative px-1">
                Premium Services
                <span className="absolute -top-1 -right-2 size-2 bg-rose-700 rounded-full animate-pulse"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Open Source Roadmap Section */}
        <div className={`space-y-10 ${activeTab === "open-source" ? "" : "hidden"}`}>
          {/* Introduction */}
          <div className="mb-10 p-4 border border-border rounded-md bg-muted/20">
            <p className="text-sm mb-4">
              <a href="https://registry.directory" className="text-foreground hover:underline">registry.directory</a> aims to be the central hub where all shadcn/ui registries live.
              Our platform will let you discover, preview, and use components from various registries
              while maintaining compatibility with the shadcn CLI.
            </p>
            <div className="text-xs font-mono text-muted-foreground">
              <pre className="p-2 bg-muted rounded-md overflow-x-auto">
              <code>{`export REGISTRY_URL="registry.directory/[registry-name]/r"`}</code><br />
              <code>{`pnpm dlx shadcn@latest add button`}</code>
              </pre>
            </div>
          </div>
          
          {/* Milestone 1 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-700 text-xs font-mono font-bold">1</div>
              <h2 className="text-lg font-mono font-medium">Data Infrastructure</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Building a solid foundation to store and retrieve registry information.
            </p>
            <div className="pl-8 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Use types from the official <span className="font-mono bg-muted px-1 rounded">shadcn/registry</span> npm package</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Implement registry loaders for local and remote data</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Create registry validation functions</p>
              </div>
            </div>
          </div>

          {/* Milestone 2 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-700 text-xs font-mono font-bold">2</div>
              <h2 className="text-lg font-mono font-medium">API Endpoints & Component Testing</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Building compatible API endpoints that work seamlessly with the shadcn CLI.
            </p>
            <div className="pl-8 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Implement shadcn-compatible REST API endpoints</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Test with diverse component types</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Add caching strategies for better performance</p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="text-xs font-mono text-muted-foreground">
                <pre className="p-2 bg-muted rounded-md overflow-x-auto">
                  <code>{`# Full registry data
GET /[registry]/r/registry.json

# List of all components
GET /[registry]/r/index.json

# Component styles
GET /[registry]/r/styles/[style]/[theme]/[component].json`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Milestone 3 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-700 text-xs font-mono font-bold">3</div>
              <h2 className="text-lg font-mono font-medium">Registry Directory UI</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Creating a beautiful, intuitive interface for browsing and previewing components.
            </p>
            <div className="pl-8 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Enhanced registry cards with search functionality</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Component preview pages with visualization</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Interactive component playground for testing</p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/30 border-b p-2 flex items-center">
                  <div className="size-3 rounded-full bg-rose-700 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-yellow-500 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-green-500 mr-1.5"></div>
                  <div className="text-xs font-mono text-muted-foreground ml-2">Component Preview</div>
                </div>
                <div className="h-32 flex items-center justify-center bg-muted/10 p-4">
                  <div className="border border-dashed border-muted-foreground/40 rounded-md p-6 flex items-center justify-center">
                    <span className="text-xs font-mono text-muted-foreground">Preview content will appear here</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestone 4 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-700 text-xs font-mono font-bold">4</div>
              <h2 className="text-lg font-mono font-medium">Build Process & Deployment</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Optimizing performance and setting up deployment infrastructure.
            </p>
            <div className="pl-8 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Implement Next.js optimization techniques</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Set up Vercel deployment pipeline with preview deployments</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Set up monitoring and analytics</p>
              </div>
            </div>
          </div>

          {/* Milestone 5 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-700 text-xs font-mono font-bold">5</div>
              <h2 className="text-lg font-mono font-medium">Directory Extension Schema</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Extending the standard registry format with our own special features.
            </p>
            <div className="pl-8 space-y-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Create <span className="font-mono bg-muted px-1 rounded">directory.json</span> schema</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Define extended properties (featured, categories, stats)</p>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
                <p className="text-sm">Create documentation for registry authors</p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="text-xs font-mono text-muted-foreground">
                <pre className="p-2 bg-muted rounded-md overflow-x-auto">
                  <code>{`{
  "featured": true,
  "categories": ["ui", "blocks", "templates"],
  "compatibilityVersion": "0.4.0",
  "stats": {
    "downloads": 1200,
    "stars": 450
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Services Section */}
        <div className={`space-y-10 ${activeTab === "premium" ? "" : "hidden"}`}>
          {/* Premium Service 1: Registry Studio */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-rose-700 to-purple-700 text-xs font-mono font-bold">01</div>
              <h2 className="text-lg font-mono font-medium">Registry Studio</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Mix and match components from different registries to create and deploy custom templates in seconds. This is a real use case for @vercel/runs
            </p>
            <div className="pl-8 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4"></path>
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
                  <path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path>
                </svg>
                <p className="font-medium">Problem: <span className="font-normal text-muted-foreground">Developers spend hours testing component combinations and building templates</span></p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <p className="font-medium">Value: <span className="font-normal text-muted-foreground">Visual drag-and-drop interface to create, preview, and deploy templates instantly</span></p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/30 border-b p-2 flex items-center">
                  <div className="size-3 rounded-full bg-rose-700 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-yellow-500 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-green-500 mr-1.5"></div>
                  <div className="text-xs font-mono text-muted-foreground ml-2">Registry Studio</div>
                </div>
                <div className="h-40 flex flex-col bg-muted/10 p-4">
                  <div className="flex gap-2 mb-4">
                    <div className="w-1/3 border border-dashed border-muted-foreground/40 rounded-md p-1 flex items-center justify-center bg-muted/20">
                      <span className="text-xs font-mono text-muted-foreground">Components</span>
                    </div>
                    <div className="w-2/3 border border-dashed border-muted-foreground/40 rounded-md p-1 flex items-center justify-center bg-muted/20">
                      <span className="text-xs font-mono text-muted-foreground">Preview</span>
                    </div>
                  </div>
                  <div className="border border-dashed border-muted-foreground/40 rounded-md p-1 flex-1 flex items-center justify-center bg-muted/20">
                    <span className="text-xs font-mono text-muted-foreground">Component Canvas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Service 2: AI Component Generator */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-rose-700 to-purple-700 text-xs font-mono font-bold">02</div>
              <h2 className="text-lg font-mono font-medium">AI Component Generator</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Generate custom UI components from text descriptions <strong>inside v0.dev</strong>. People can craft websites using existing registries.
            </p>
            <div className="pl-8 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4"></path>
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
                  <path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path>
                </svg>
                <p className="font-medium">Problem: <span className="font-normal text-muted-foreground">Building custom components requires significant development time</span></p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <p className="font-medium">Value: <span className="font-normal text-muted-foreground">Turn text prompts into production-ready UI components in seconds</span></p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="text-xs font-mono text-muted-foreground">
                <pre className="p-2 bg-muted rounded-md overflow-x-auto">
                  <code>{`// From text to component in seconds
"Create a pricing table with 3 tiers and a highlighted preferred option"

↓ ↓ ↓

npx shadcn@latest add https://registry.directory/<company>/r/pricing-table

↓ ↓ ↓

<PricingTable 
  tiers={[
    { name: "Basic", price: "$9", featured: false, ... },
    { name: "Pro", price: "$29", featured: true, ... },
    { name: "Enterprise", price: "$99", featured: false, ... }
  ]} 
/>`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Premium Service 3: Registry Monetization */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-rose-700 to-purple-700 text-xs font-mono font-bold">03</div>
              <h2 className="text-lg font-mono font-medium">Registry Monetization</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Help registry creators promote and monetize their work with premium features and analytics. I maintain the <a href="https://github.com/rbadillap/zeta" className="text-foreground hover:underline">Zeta registry</a> the most liked shadcn registry for premium components.
            </p>
            <div className="pl-8 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4"></path>
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
                  <path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path>
                </svg>
                <p className="font-medium">Problem: <span className="font-normal text-muted-foreground">Registry creators struggle to monetize their hard work and reach users</span></p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <p className="font-medium">Value: <span className="font-normal text-muted-foreground">Subscription and licensing options with analytics and promotional tools</span></p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/30 border-b p-2 flex items-center">
                  <div className="size-3 rounded-full bg-rose-700 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-yellow-500 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-green-500 mr-1.5"></div>
                  <div className="text-xs font-mono text-muted-foreground ml-2">Zeta Registry</div>
                </div>
                <div className="flex items-center justify-center p-4">
                  <img 
                    src="/zeta.png" 
                    alt="Zeta Registry - An open source registry for shadcn/ui components built for private and premium projects" 
                    className="rounded-md w-full max-w-md h-auto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Premium Service 4: AI Component Documentation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-rose-700 to-purple-700 text-xs font-mono font-bold">04</div>
              <h2 className="text-lg font-mono font-medium">AI Component Documentation</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Generate intelligent documentation from your components with AI-powered insights and interactive examples.
            </p>
            <div className="pl-8 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4"></path>
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
                  <path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path>
                </svg>
                <p className="font-medium">Problem: <span className="font-normal text-muted-foreground">Documentation is time-consuming and often outdated or incomplete</span></p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <p className="font-medium">Value: <span className="font-normal text-muted-foreground">Automatically generate and update documentation with AI assistance and MCP integrations</span></p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/30 border-b p-2 flex items-center">
                  <div className="size-3 rounded-full bg-rose-700 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-yellow-500 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-green-500 mr-1.5"></div>
                  <div className="text-xs font-mono text-muted-foreground ml-2">Component Explorer</div>
                </div>
                <div className="p-4 bg-muted/10">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-1/3 space-y-2">
                      <div className="text-xs font-medium font-mono pb-1 border-b border-border">Documentation</div>
                      <div className="text-xs text-muted-foreground">
                        <div className="mb-1">📄 Button.docs.tsx</div>
                        <div className="mb-1">📄 Card.docs.tsx</div>
                        <div className="mb-1">📄 Dialog.docs.tsx</div>
                      </div>
                    </div>
                    <div className="md:w-2/3 space-y-3">
                      <div className="text-xs font-medium font-mono pb-1 border-b border-border">AI-Generated Documentation</div>
                      <div className="text-xs text-muted-foreground">
                        <div className="p-2 border border-dashed border-muted-foreground/20 rounded-md mb-2">
                          <span className="font-medium text-foreground">Usage</span>
                          <div className="mt-1">Import the Button component and use it with various variants and sizes.</div>
                        </div>
                        <div className="p-2 border border-dashed border-muted-foreground/20 rounded-md">
                          <span className="font-medium text-foreground">Properties</span>
                          <div className="mt-1">AI-detected props and their descriptions automatically updated when code changes.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Service 5: Enterprise Design System */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gradient-to-br from-rose-700 to-purple-700 text-xs font-mono font-bold">05</div>
              <h2 className="text-lg font-mono font-medium">Enterprise Design System</h2>
            </div>
            <p className="text-sm mb-3 pl-8 text-muted-foreground">
              Build and manage private design systems with team collaboration features and access controls.
            </p>
            <div className="pl-8 space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 12 2 2 4-4"></path>
                  <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"></path>
                  <path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path>
                </svg>
                <p className="font-medium">Problem: <span className="font-normal text-muted-foreground">Teams struggle to maintain consistent design systems across multiple projects</span></p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <svg className="w-4 h-4 mt-0.5 text-rose-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
                <p className="font-medium">Value: <span className="font-normal text-muted-foreground">Private registry with collaboration tools, versioning, and access controls</span></p>
              </div>
            </div>
            <div className="mt-4 pl-8">
              <div className="border rounded-md overflow-hidden">
                <div className="bg-muted/30 border-b p-2 flex items-center">
                  <div className="size-3 rounded-full bg-rose-700 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-yellow-500 mr-1.5"></div>
                  <div className="size-3 rounded-full bg-green-500 mr-1.5"></div>
                  <div className="text-xs font-mono text-muted-foreground ml-2">Design System Manager</div>
                </div>
                <div className="p-4 bg-muted/10">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="md:w-1/3 space-y-3">
                      <div className="text-xs font-medium mb-2">Team Access</div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span className="size-2 rounded-full bg-green-500"></span>
                        <span>Designers</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span className="size-2 rounded-full bg-blue-500"></span>
                        <span>Developers</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span className="size-2 rounded-full bg-amber-500"></span>
                        <span>Managers</span>
                      </div>
                    </div>
                    <div className="md:w-2/3 space-y-3">
                      <div className="text-xs font-medium mb-2">Component Library</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 border border-dashed border-muted-foreground/20 rounded-md text-muted-foreground text-xs text-center">v1.2.3</div>
                        <div className="p-2 border border-dashed border-muted-foreground/20 rounded-md text-muted-foreground text-xs text-center">v1.1.0</div>
                        <div className="p-2 border border-dashed border-muted-foreground/20 rounded-md text-muted-foreground text-xs text-center">v1.0.0</div>
                        <div className="p-2 border border-dashed border-muted-foreground/20 rounded-md text-muted-foreground text-xs text-center">v0.9.0</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with contribute link */}
        <div className="mt-16 pt-6 border-t border-border">
          <p className="text-sm text-center text-muted-foreground">
            Interested in contributing? 
            <a 
              href="https://github.com/rbadillap/registry.directory" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-mono ml-2 text-foreground hover:underline"
            >
              Check our GitHub
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Roadmap; 