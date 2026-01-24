import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './components/card';
import { Button } from './components/button';

export default function App() {
  return (
    <div className="p-8 flex flex-col gap-8">
      <h2 className="text-lg font-semibold">Card Examples</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Card</CardTitle>
            <CardDescription>A simple card with title and description</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              This is the card content. You can put any content here.
            </p>
          </CardContent>
        </Card>

        {/* Card with Footer */}
        <Card>
          <CardHeader>
            <CardTitle>Card with Footer</CardTitle>
            <CardDescription>This card has a footer with actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Cards can contain footers with buttons or other actions.
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" size="sm">Cancel</Button>
            <Button size="sm">Submit</Button>
          </CardFooter>
        </Card>

        {/* Interactive Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <CardDescription>Hover over this card</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              Cards can have hover effects and be interactive.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
