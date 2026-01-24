import { Button } from "@workspace/ui/components/button"

export default function ButtonPreview() {
  return (
    <div className="p-8 flex flex-col gap-4">
      <h2 className="text-lg font-semibold mb-4">Button Variants</h2>

      <div className="flex flex-wrap gap-4">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-4">Button Sizes</h2>

      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">I</Button>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-4">Disabled State</h2>

      <div className="flex flex-wrap gap-4">
        <Button disabled>Disabled</Button>
        <Button variant="secondary" disabled>Disabled</Button>
        <Button variant="outline" disabled>Disabled</Button>
      </div>
    </div>
  )
}
