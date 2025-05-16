# Registry.Directory Roadmap

This document outlines the development roadmap for registry.directory, a platform that collects and standardizes shadcn/ui registries.

## Context

Registry.directory aims to be the central hub for all shadcn/ui registries. The platform will allow users to discover, preview, and use components from various registries while maintaining compatibility with the shadcn CLI.

- Current structure: We have the basic skeleton in `apps/web/app/page.tsx` that lists various registries
- Reference implementation: We've started with `packages/data/src/registries/shadcn.ts` as our example registry
- Standard format: We follow the shadcn registry schema as defined in:
  - In the npm package shadcn/registry the type: Registry, or its URL https://ui.shadcn.com/schema/registry.json
  - In the npm package shadcn/registry the type: RegistryItem, or its URL https://ui.shadcn.com/schema/registry-item.json 

The standard folder structure includes:
- Registry definition files in `packages/data/src/registries/`
- API routes in `apps/web/app/[registry]/r/` following RESTful conventions (example: `apps/web/app/shadcn/r/` as seen in the repo)
- Custom extension via `directory.json` for registry.directory-specific features

## Milestone 1: Data Infrastructure

**Goal:** Implement the data layer for storing and retrieving registry information.

### Tasks:
1. Leverage the types from the official `shadcn/registry` npm package 
2. Extend the registry class in `packages/data/src/registry.ts` to handle standard registry data
3. Implement registry loaders that can:
   - Load local registry files from `packages/data/src/registries/`
   - Fetch remote registry data from external sources
4. Add registry validation functions
5. Create data access utilities for the API layer

## Milestone 2: API Endpoints & Component Testing

**Goal:** Build API endpoints that are compatible with the shadcn CLI and thoroughly test with various component types to ensure universal compatibility.

### Tasks:
1. Understand and implement the fetchRegistry flow using shadcn's official approach
2. Test with diverse component types:
   - Simple UI components (Button, Card)
   - Complex components with dependencies
   - Block components
   - Third-party components
   - Components with various file structures
3. Develop robust logic to generate required files for any registry regardless of structure
4. Implement RESTful API routes in `apps/web/app/api/registry/[name]/route.ts`
5. Implement standardized shadcn-compatible endpoints that follow official conventions:
   - `apps/web/app/[registry]/r/registry.json` - Returns the full registry metadata (shadcn standard)
   - `apps/web/app/[registry]/r/[componentName]/registry-item.json` - Returns specific component data (shadcn standard)
   - `apps/web/app/[registry]/r/index.json` - Returns a list of all registry items (shadcn standard)
6. Add registry.directory-specific endpoints:
   - `apps/web/app/api/registries` - Returns a list of all available registries
   - Ensure all endpoints are designed with potential shadcn core integration in mind
7. Implement caching strategies for better performance
8. Add rate limiting and security measures

## Milestone 3: Registry Directory UI

**Goal:** Create a user-friendly interface for browsing, searching, and previewing registry components that aligns with the registry schema metadata.

### Tasks:
1. Enhance `apps/web/app/page.tsx` with:
   - Improved registry cards that display schema metadata (author, description)
   - Search functionality
   - Category filters leveraging registry item categories
   - Featured section
2. Build registry detail pages at `apps/web/app/registry/[name]/page.tsx` that display full registry metadata
3. Create component preview pages at `apps/web/app/registry/[name]/[component]/page.tsx` with:
   - Component visualization
   - Metadata display (dependencies, registryDependencies, etc.)
   - Usage instructions based on component documentation
4. Add interactive component playground for testing components
5. Implement code copy functionality
6. Create documentation pages explaining how to use registry.directory
7. Design UI elements that would seamlessly integrate with the shadcn ecosystem

## Milestone 4: Build Process & Deployment

**Goal:** Optimize the build process and deployment pipeline to ensure maximum performance.

### Tasks:
1. Implement Next.js optimization techniques:
   - Static generation where possible
   - Server components for dynamic data
   - Edge functions for high-performance API routes
2. Set up Vercel deployment pipeline:
   - Configure build settings
   - Set up environment variables
   - Implement preview deployments
3. Performance optimization:
   - Image optimization
   - Font loading strategies
   - Code splitting
   - Bundle size reduction
4. Monitoring and analytics:
   - Set up Vercel Analytics
   - Implement error tracking
   - Monitor Web Vitals
5. Set up automated tests for CI/CD

## Milestone 5: Directory Extension Schema

**Goal:** Define the `directory.json` schema to extend the standard `registry.json` format with registry.directory-specific metadata.

### Tasks:
1. Create `packages/schema/directory.json` schema file
2. Define extended properties such as:
   - `featured`: boolean flag for featured registries
   - `categories`: array of category tags
   - `author`: expanded author information (name, email, twitter, etc.)
   - `stats`: usage statistics and popularity metrics
   - `compatibilityVersion`: shadcn/ui version compatibility
   - `lastUpdated`: timestamp of last update
3. Implement functionality to merge registry.json and directory.json data
4. Create documentation explaining how to create a directory.json file
5. Reach out to registry authors to help them create directory.json files

## References

- Shadcn Registry Schema: https://ui.shadcn.com/schema/registry.json
- Shadcn Registry Item Schema: https://ui.shadcn.com/schema/registry-item.json
- Shadcn Registry Documentation: https://ui.shadcn.com/docs/registry/registry-json
- Shadcn Registry Item Documentation: https://ui.shadcn.com/docs/registry/registry-item-json
- Current Registry Directory Implementation: `apps/web/app/page.tsx`
- Sample Registry Implementation: `packages/data/src/registries/shadcn.ts` 