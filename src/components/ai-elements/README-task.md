# Task Component

The `Task` component provides a structured way to display task lists or workflow progress with collapsible details, status indicators, and progress tracking.

## Features

- Visual icons for pending, in-progress, completed, and error states
- Expandable content for task descriptions and additional information
- Built-in progress counter showing completed vs total tasks
- Support for custom content within task items
- Full type safety with proper TypeScript definitions
- Keyboard navigation and screen reader support

## Installation

The Task component is already included in the project and uses the following dependencies:
- `@radix-ui/react-collapsible`
- `lucide-react`
- Tailwind CSS

## Usage

### Basic Usage

```tsx
import { 
  Task, 
  TaskTrigger, 
  TaskContent, 
  TaskItem 
} from '@/components/ai-elements/task';

<Task status="pending" defaultOpen={true}>
  <TaskTrigger title="Project Setup" status="pending" />
  <TaskContent>
    <TaskItem status="completed">
      Initialize project with npm
    </TaskItem>
    <TaskItem status="in_progress">
      Install dependencies
    </TaskItem>
    <TaskItem status="pending">
      Configure build tools
    </TaskItem>
  </TaskContent>
</Task>
```

### With File References

```tsx
import { TaskItemFile } from '@/components/ai-elements/task';
import { FileText, Code } from 'lucide-react';

<Task status="in_progress">
  <TaskTrigger title="Code Review" status="in_progress" />
  <TaskContent>
    <TaskItem status="completed">
      Review <TaskItemFile icon={<FileText className="h-4 w-4" />}>package.json</TaskItemFile>
    </TaskItem>
    <TaskItem status="in_progress">
      Review <TaskItemFile icon={<Code className="h-4 w-4" />}>src/components/Task.tsx</TaskItemFile>
    </TaskItem>
  </TaskContent>
</Task>
```

### Using TaskList for Multiple Tasks

```tsx
import { TaskList } from '@/components/ai-elements/task';

const tasks = [
  {
    id: '1',
    title: 'Project Setup',
    status: 'completed',
    items: [
      { id: '1-1', text: 'Initialize project', status: 'completed' },
      { id: '1-2', text: 'Install dependencies', status: 'completed' }
    ]
  },
  {
    id: '2',
    title: 'Component Development',
    status: 'in_progress',
    items: [
      { id: '2-1', text: 'Create component structure', status: 'completed' },
      { id: '2-2', text: 'Implement functionality', status: 'in_progress' }
    ]
  }
];

<TaskList tasks={tasks} showProgress={true} />
```

## API Reference

### Task

The main container component for a single task.

#### Props

- `status?: TaskStatus` - The status of the task ('pending', 'in_progress', 'completed', 'error')
- `defaultOpen?: boolean` - Whether the task content is open by default
- `...props` - All other props are spread to the root Collapsible component

### TaskTrigger

The clickable header for the task.

#### Props

- `title: string` - The title of the task
- `status?: TaskStatus` - The status of the task
- `showStatus?: boolean` - Whether to show the status icon (default: true)
- `...props` - All other props are spread to the CollapsibleTrigger component

### TaskContent

The collapsible content area for the task.

#### Props

- `...props` - All other props are spread to the CollapsibleContent component

### TaskItem

A single item within a task.

#### Props

- `status?: TaskStatus` - The status of the item
- `...props` - All other props are spread to the underlying div

### TaskItemFile

A file reference within a task item.

#### Props

- `icon?: React.ReactNode` - Optional icon to display
- `...props` - All other props are spread to the underlying div

### TaskList

A container for managing multiple tasks with progress tracking.

#### Props

- `tasks?: Array<TaskData>` - Array of task data objects
- `showProgress?: boolean` - Whether to show the progress counter (default: true)
- `...props` - All other props are spread to the underlying div

#### TaskData Interface

```tsx
interface TaskData {
  id: string;
  title: string;
  status: TaskStatus;
  items?: Array<{
    id: string;
    text: string;
    status: TaskStatus;
    file?: {
      name: string;
      icon?: React.ReactNode;
    };
  }>;
}
```

## Status Types

- `pending` - Task/item is waiting to be started
- `in_progress` - Task/item is currently being worked on
- `completed` - Task/item has been finished
- `error` - Task/item encountered an error

## Styling

The Task component uses Tailwind CSS classes and follows the project's design system. Status-based styling is automatically applied:

- **Pending**: Gray border and background
- **In Progress**: Blue border and background with spinning clock icon
- **Completed**: Green border and background with checkmark icon
- **Error**: Red border and background with alert icon

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- Proper ARIA attributes via Radix UI
- Focus management for collapsible content

## Examples

See `task-example.tsx` for complete usage examples including:
- Basic task usage
- Tasks with file references
- TaskList with multiple tasks
- Complete workflow examples
