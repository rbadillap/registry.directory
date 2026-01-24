import { WebContainer, type FileSystemTree } from "@webcontainer/api"

export type WebContainerStatus =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "error"

export interface WebContainerState {
  status: WebContainerStatus
  error?: string
  previewUrl?: string
}

type StateListener = (state: WebContainerState) => void

class WebContainerService {
  private static instance: WebContainerService | null = null
  private container: WebContainer | null = null
  private bootPromise: Promise<WebContainer> | null = null
  private state: WebContainerState = { status: "idle" }
  private listeners: Set<StateListener> = new Set()
  private currentPreviewUrl: string | null = null

  static getInstance(): WebContainerService {
    if (!WebContainerService.instance) {
      WebContainerService.instance = new WebContainerService()
    }
    return WebContainerService.instance
  }

  private setState(newState: Partial<WebContainerState>) {
    this.state = { ...this.state, ...newState }
    this.listeners.forEach((listener) => listener(this.state))
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  getState(): WebContainerState {
    return this.state
  }

  async boot(): Promise<WebContainer> {
    if (this.container) {
      return this.container
    }

    if (this.bootPromise) {
      return this.bootPromise
    }

    this.setState({ status: "booting" })

    try {
      this.bootPromise = WebContainer.boot()
      this.container = await this.bootPromise

      // Listen for server-ready events
      this.container.on("server-ready", (_port, url) => {
        this.currentPreviewUrl = url
        this.setState({ status: "ready", previewUrl: url })
      })

      return this.container
    } catch (error) {
      const message = error instanceof Error ? error.message : "Boot failed"
      this.setState({ status: "error", error: message })
      throw error
    }
  }

  async mount(files: FileSystemTree): Promise<void> {
    const container = await this.boot()
    this.setState({ status: "mounting" })

    try {
      await container.mount(files)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mount failed"
      this.setState({ status: "error", error: message })
      throw error
    }
  }

  async install(): Promise<void> {
    const container = await this.boot()
    this.setState({ status: "installing" })

    try {
      const process = await container.spawn("npm", ["install"])

      // Stream output for debugging
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("[npm install]", data)
          },
        })
      )

      const exitCode = await process.exit

      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Install failed"
      this.setState({ status: "error", error: message })
      throw error
    }
  }

  async startDevServer(): Promise<string> {
    const container = await this.boot()
    this.setState({ status: "starting" })

    try {
      // Start the dev server (don't await - it runs indefinitely)
      const process = await container.spawn("npm", ["run", "dev"])

      // Stream output for debugging
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            console.log("[vite]", data)
          },
        })
      )

      // Wait for server-ready event
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Dev server timeout"))
        }, 30000)

        const unsubscribe = this.subscribe((state) => {
          if (state.status === "ready" && state.previewUrl) {
            clearTimeout(timeout)
            resolve(state.previewUrl)
          } else if (state.status === "error") {
            clearTimeout(timeout)
            reject(new Error(state.error))
          }
        })

        // Cleanup on reject
        setTimeout(() => unsubscribe, 30000)
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Dev server failed"
      this.setState({ status: "error", error: message })
      throw error
    }
  }

  async runPreview(files: FileSystemTree): Promise<string> {
    await this.mount(files)
    await this.install()
    return this.startDevServer()
  }

  getCurrentPreviewUrl(): string | null {
    return this.currentPreviewUrl
  }

  // For teardown / cleanup if needed
  async teardown(): Promise<void> {
    if (this.container) {
      await this.container.teardown()
      this.container = null
      this.bootPromise = null
      this.currentPreviewUrl = null
      this.setState({ status: "idle", previewUrl: undefined, error: undefined })
    }
  }
}

export const webContainerService = WebContainerService.getInstance()
