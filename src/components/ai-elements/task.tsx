'use client';

import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown, CheckCircle, Circle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

// Task status types
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'error';

// Task component props
export interface TaskProps extends React.ComponentProps<typeof CollapsiblePrimitive.Root> {
  status?: TaskStatus;
  defaultOpen?: boolean;
}

// TaskTrigger component props
export interface TaskTriggerProps extends React.ComponentProps<typeof CollapsiblePrimitive.Trigger> {
  title: string;
  status?: TaskStatus;
  showStatus?: boolean;
  isOpen?: boolean;
}

// TaskContent component props
export interface TaskContentProps extends React.ComponentProps<typeof CollapsiblePrimitive.Content> {}

// TaskItem component props
export interface TaskItemProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: TaskStatus;
}

// TaskItemFile component props
export interface TaskItemFileProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

// Status icon component
const StatusIcon = ({ status }: { status?: TaskStatus }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
    default:
      return <Circle className="h-4 w-4 text-gray-400" />;
  }
};

// Main Task component
export function Task({ 
  children, 
  status = 'pending', 
  defaultOpen = false,
  className,
  ...props 
}: TaskProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <CollapsiblePrimitive.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'border rounded-lg bg-background',
        status === 'completed' && 'border-green-200 bg-green-50/50',
        status === 'in_progress' && 'border-blue-200 bg-blue-50/50',
        status === 'error' && 'border-red-200 bg-red-50/50',
        status === 'pending' && 'border-gray-200',
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TaskTrigger) {
          return React.cloneElement(child, { isOpen } as any);
        }
        return child;
      })}
    </CollapsiblePrimitive.Root>
  );
}

// TaskTrigger component
export function TaskTrigger({ 
  title, 
  status = 'pending', 
  showStatus = true,
  isOpen = false,
  className,
  children,
  ...props 
}: TaskTriggerProps) {
  return (
    <CollapsiblePrimitive.Trigger
      className={cn(
        'flex w-full items-center justify-between p-4 text-left font-medium transition-all hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {showStatus && <StatusIcon status={status} />}
        <span className="text-base font-semibold">{title}</span>
      </div>
      <ChevronDown 
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} 
      />
    </CollapsiblePrimitive.Trigger>
  );
}

// TaskContent component
export function TaskContent({ 
  className,
  children,
  ...props 
}: TaskContentProps) {
  return (
    <CollapsiblePrimitive.Content
      className={cn(
        'overflow-hidden text-base transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        className
      )}
      {...props}
    >
      <div className="p-2 pt-0">
        {children}
      </div>
    </CollapsiblePrimitive.Content>
  );
}

// TaskItem component
export function TaskItem({ 
  status = 'pending',
  className,
  children,
  ...props 
}: TaskItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 py-1',
        status === 'completed' && 'text-muted-foreground',
        className
      )}
      {...props}
    >
      <StatusIcon status={status} />
      <div className="flex-1">{children}</div>
    </div>
  );
}

// TaskItemFile component
export function TaskItemFile({ 
  icon,
  className,
  children,
  ...props 
}: TaskItemFileProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm font-mono font-semibold',
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

// TaskList component for managing multiple tasks
export interface TaskListProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks?: Array<{
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
  }>;
  showProgress?: boolean;
}

export function TaskList({ 
  tasks = [], 
  showProgress = true,
  className,
  children,
  ...props 
}: TaskListProps) {
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;

  return (
    <div className={cn('space-y-4', className)} {...props}>
      {showProgress && totalTasks > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{completedTasks} of {totalTasks} completed</span>
        </div>
      )}
      
      {children || tasks.map((task) => (
        <Task key={task.id} status={task.status}>
          <TaskTrigger title={task.title} status={task.status} />
          <TaskContent>
            {task.items?.map((item) => (
              <TaskItem key={item.id} status={item.status}>
                {item.file ? (
                  <>
                    {item.text}
                    <TaskItemFile icon={item.file.icon}>
                      {item.file.name}
                    </TaskItemFile>
                  </>
                ) : (
                  item.text
                )}
              </TaskItem>
            ))}
          </TaskContent>
        </Task>
      ))}
    </div>
  );
}
