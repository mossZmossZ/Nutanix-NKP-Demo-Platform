import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

test('Tabs switches content when a trigger is clicked', async () => {
  render(
    <Tabs defaultValue="a">
      <TabsList>
        <TabsTrigger value="a">A</TabsTrigger>
        <TabsTrigger value="b">B</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Content A</TabsContent>
      <TabsContent value="b">Content B</TabsContent>
    </Tabs>,
  )
  expect(screen.getByText('Content A')).toBeInTheDocument()
  await userEvent.setup().click(screen.getByRole('tab', { name: 'B' }))
  expect(screen.getByText('Content B')).toBeInTheDocument()
})

test('ResizablePanelGroup renders both panels and a drag handle', () => {
  render(
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={40}>Left</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={60}>Right</ResizablePanel>
    </ResizablePanelGroup>,
  )
  expect(screen.getByText('Left')).toBeInTheDocument()
  expect(screen.getByText('Right')).toBeInTheDocument()
})
