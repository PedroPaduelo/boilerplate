import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import {
  User,
  Settings,
  Trash2,
  Bell,
  Search,
  Download,
  Menu,
  X,
  Layers,
  Palette,
  Code,
  FileText,
  Home,
  ChevronRight,
} from 'lucide-react'

// UI Components - Form Controls
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import { Switch } from '@/shared/components/ui/switch'
import { Slider } from '@/shared/components/ui/slider'
import { Progress } from '@/shared/components/ui/progress'

// UI Components - Data Display
import { Badge } from '@/shared/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

// UI Components - Navigation
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/components/ui/pagination'

// UI Components - Overlay
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/shared/components/ui/command'

// UI Components - Feedback
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Separator } from '@/shared/components/ui/separator'

// UI Components - Layout
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Skeleton } from '@/shared/components/ui/skeleton'

// UI Components - Other
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
}

const Section = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) => (
  <motion.section
    variants={itemVariants}
    className="space-y-6 py-8 border-b border-border/40 last:border-0"
  >
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
    <div className="space-y-4">{children}</div>
  </motion.section>
)

const ShowcasePage = () => {
  const [sliderValue, setSliderValue] = useState([50])
  const [progressValue] = useState(75)
  const [commandOpen, setCommandOpen] = useState(false)

  // Sample data for table
  const tableData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
    { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'Editor', status: 'Pending' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'Inactive' },
  ]

  // Command palette items
  type CommandItemDef = {
    label: string
    shortcut?: string
    icon: LucideIcon
  }

  type CommandGroupDef = {
    heading: string
    items: CommandItemDef[]
  }

  const commandItems: CommandGroupDef[] = [
    {
      heading: 'Actions',
      items: [
        { label: 'New Project', shortcut: 'N', icon: FileText },
        { label: 'New Folder', shortcut: 'F', icon: Layers },
        { label: 'Import', shortcut: 'I', icon: Download },
      ],
    },
    {
      heading: 'Navigation',
      items: [
        { label: 'Dashboard', icon: Home },
        { label: 'Settings', icon: Settings },
        { label: 'Search', icon: Search },
      ],
    },
  ]

  return (
    <TooltipProvider>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 md:p-8"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.header variants={itemVariants} className="space-y-4 text-center py-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              UI Component Showcase
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive demonstration of all UI components available in the 99Freela Agent
              boilerplate. Explore buttons, forms, overlays, and more.
            </p>
          </motion.header>

          {/* Breadcrumb Demo */}
          <motion.div variants={itemVariants}>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Showcase</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </motion.div>

          {/* Buttons Section */}
          <Section
            title="Buttons"
            description="Clickable elements with various styles, sizes, and states."
          >
            <div className="space-y-6">
              {/* Variants */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Sizes</h3>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* With Icons */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">With Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button variant="secondary">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {/* Form Controls Section */}
          <Section title="Form Controls" description="Input components for collecting user data.">
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Input and Textarea */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="input">Input</Label>
                    <Input id="input" placeholder="Enter your name" />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="textarea">Textarea</Label>
                    <Textarea id="textarea" placeholder="Enter your message" />
                  </div>
                </div>

                {/* Select */}
                <div className="space-y-3">
                  <Label>Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkbox and Radio */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Checkbox</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" />
                        <Label htmlFor="terms" className="font-normal">
                          Accept terms and conditions
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="newsletter" />
                        <Label htmlFor="newsletter" className="font-normal">
                          Subscribe to newsletter
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Radio Group</Label>
                    <RadioGroup defaultValue="option1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option1" id="r1" />
                        <Label htmlFor="r1" className="font-normal">
                          Option 1
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option2" id="r2" />
                        <Label htmlFor="r2" className="font-normal">
                          Option 2
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option3" id="r3" />
                        <Label htmlFor="r3" className="font-normal">
                          Option 3
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {/* Switch and Slider */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Switch</Label>
                    <div className="flex items-center space-x-4">
                      <Switch id="airplane-mode" />
                      <Label htmlFor="airplane-mode" className="font-normal">
                        Airplane mode
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Slider: {sliderValue}%</Label>
                    <Slider
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <Label>Progress: {progressValue}%</Label>
                  <Progress value={progressValue} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Data Display Section */}
          <Section title="Data Display" description="Components for presenting data and status.">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>Small status indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Avatar */}
              <Card>
                <CardHeader>
                  <CardTitle>Avatar</CardTitle>
                  <CardDescription>User profile images</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        AB
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="h-14 w-14">
                      <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        LM
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>

              {/* Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Card</CardTitle>
                  <CardDescription>Container with sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Cards are flexible containers with header, content, and footer sections.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Learn More</Button>
                </CardFooter>
              </Card>
            </div>
          </Section>

          {/* Navigation Section */}
          <Section title="Navigation" description="Components for navigating through content.">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle>Tabs</CardTitle>
                  <CardDescription>Switch between content views</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="account" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="account">Account</TabsTrigger>
                      <TabsTrigger value="password">Password</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Manage your account settings and preferences.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" defaultValue="John Doe" />
                      </div>
                    </TabsContent>
                    <TabsContent value="password" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Change your password and security settings.
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input id="current" type="password" />
                      </div>
                    </TabsContent>
                    <TabsContent value="settings" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Configure your application preferences.
                      </p>
                      <div className="flex items-center justify-between">
                        <Label>Email Notifications</Label>
                        <Switch />
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Accordion */}
              <Card>
                <CardHeader>
                  <CardTitle>Accordion</CardTitle>
                  <CardDescription>Expandable content sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>What is this application?</AccordionTrigger>
                      <AccordionContent>
                        This is a comprehensive UI component showcase demonstrating all available
                        components in the 99Freela Agent boilerplate.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>How do I get started?</AccordionTrigger>
                      <AccordionContent>
                        Simply explore the components on this page and check the documentation for
                        implementation details.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                      <AccordionTrigger>Can I customize the components?</AccordionTrigger>
                      <AccordionContent>
                        Yes! All components support customization through Tailwind CSS classes and
                        variant props.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Pagination */}
              <Card>
                <CardHeader>
                  <CardTitle>Pagination</CardTitle>
                  <CardDescription>Navigate through pages</CardDescription>
                </CardHeader>
                <CardContent>
                  <Pagination>
                    <PaginationPrevious href="#" />
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationLink href="#">1</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          2
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">3</PaginationLink>
                      </PaginationItem>
                      <PaginationEllipsis />
                      <PaginationItem>
                        <PaginationLink href="#">10</PaginationLink>
                      </PaginationItem>
                    </PaginationContent>
                    <PaginationNext href="#" />
                  </Pagination>
                </CardContent>
              </Card>

              {/* Dropdown Menu */}
              <Card>
                <CardHeader>
                  <CardTitle>Dropdown Menu</CardTitle>
                  <CardDescription>Context menus and actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">Open Menu</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                        <DropdownMenuShortcut>⇧P</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Palette className="mr-2 h-4 w-4" />
                          <span>Theme</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem>Light</DropdownMenuItem>
                          <DropdownMenuItem>Dark</DropdownMenuItem>
                          <DropdownMenuItem>System</DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Overlay Section */}
          <Section title="Overlay" description="Dialogs, sheets, and popup components.">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Dialog */}
              <Card>
                <CardHeader>
                  <CardTitle>Dialog</CardTitle>
                  <CardDescription>Modal dialog window</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Open Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" defaultValue="John Doe" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="username">Username</Label>
                          <Input id="username" defaultValue="@johndoe" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* Sheet */}
              <Card>
                <CardHeader>
                  <CardTitle>Sheet</CardTitle>
                  <CardDescription>Slide-in panel</CardDescription>
                </CardHeader>
                <CardContent>
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">Open Sheet</Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>Edit Profile</SheetTitle>
                        <SheetDescription>
                          Make changes to your profile here. Click save when you're done.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="sheet-name">Name</Label>
                          <Input id="sheet-name" defaultValue="John Doe" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="sheet-email">Email</Label>
                          <Input id="sheet-email" defaultValue="john@example.com" />
                        </div>
                      </div>
                      <SheetFooter>
                        <Button type="submit">Save changes</Button>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </CardContent>
              </Card>

              {/* Alert Dialog */}
              <Card>
                <CardHeader>
                  <CardTitle>Alert Dialog</CardTitle>
                  <CardDescription>Confirmation dialog</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, delete my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              {/* Tooltip */}
              <Card>
                <CardHeader>
                  <CardTitle>Tooltip</CardTitle>
                  <CardDescription>Hover for more info</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline">Hover me</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This is a tooltip with helpful information!</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>

              {/* Popover */}
              <Card>
                <CardHeader>
                  <CardTitle>Popover</CardTitle>
                  <CardDescription>Click to reveal content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Open Popover</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">Dimensions</h4>
                          <p className="text-sm text-muted-foreground">
                            Set the dimensions for your project in the settings panel.
                          </p>
                          <div className="flex gap-2">
                            <Input placeholder="Width" />
                            <Input placeholder="Height" />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>

              {/* Command */}
              <Card>
                <CardHeader>
                  <CardTitle>Command</CardTitle>
                  <CardDescription>Search and command palette</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setCommandOpen(true)}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                  <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
                    <CommandInput placeholder="Type a command or search..." />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      {commandItems.map((group, i) => (
                        <CommandGroup key={i} heading={group.heading}>
                          {group.items.map((item, j) => (
                            <CommandItem key={j}>
                              <item.icon className="mr-2 h-4 w-4" />
                              <span>{item.label}</span>
                              {item.shortcut && (
                                <CommandShortcut>{item.shortcut}</CommandShortcut>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </CommandDialog>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Feedback Section */}
          <Section title="Feedback" description="Alerts and visual separators.">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Alerts</CardTitle>
                  <CardDescription>Important messages and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTitle>Default Alert</AlertTitle>
                    <AlertDescription>This is an informational alert message.</AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertTitle>Destructive Alert</AlertTitle>
                    <AlertDescription>
                      This alert indicates an error or warning condition.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Separator */}
              <Card>
                <CardHeader>
                  <CardTitle>Separator</CardTitle>
                  <CardDescription>Visual dividers between content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">Content above</div>
                  <Separator />
                  <div className="text-sm">Content below</div>
                  <Separator />
                  <div className="flex items-center gap-4">
                    <Button variant="outline">Left</Button>
                    <Separator orientation="vertical" className="h-8" />
                    <Button variant="outline">Right</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Table Section */}
          <Section title="Table" description="Structured data display with actions.">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>A sample data table with actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="px-4 py-3 text-sm">{user.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                          <td className="px-4 py-3 text-sm">{user.role}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                user.status === 'Active'
                                  ? 'default'
                                  : user.status === 'Pending'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Menu className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <User className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* Layout Section */}
          <Section title="Layout" description="ScrollArea for contained scrolling content.">
            <Card>
              <CardHeader>
                <CardTitle>Scroll Area</CardTitle>
                <CardDescription>Custom scrollable container</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{String.fromCharCode(65 + i)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">Item {i + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            Additional details for this item
                          </p>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </Section>

          {/* Skeleton Section */}
          <Section title="Loading States" description="Skeleton components for loading placeholders.">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>

              {/* Form Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-1/3" />
                </CardContent>
              </Card>

              {/* List Skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2 mb-2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* Footer */}
          <motion.footer variants={itemVariants} className="text-center py-8 text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              Built with
              <span className="font-semibold text-foreground">99Freela Agent</span>
              <Code className="h-4 w-4" />
            </p>
          </motion.footer>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}

export { ShowcasePage }
export default ShowcasePage
